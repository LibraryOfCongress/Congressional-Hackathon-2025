import os
import re
import json
import sqlite3
from flask import Flask, g, jsonify, render_template, request
from dotenv import load_dotenv 
from pathlib import Path

load_dotenv()

# Optional: only needed if you plan to use the /api/ask endpoint with OpenAI
try:
    from openai import OpenAI
except ImportError:
    OpenAI = None  # Handle absence gracefully

app = Flask(__name__)
DB_PATH = "disbursements.db"  # adjust to absolute path if needed


# ---------- DB helpers ----------
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def run_sql_readonly(sql: str):
    # Connect read-only and execute a single SELECT
    conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    cur = conn.execute(sql)
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description] if cur.description else []
    out = [dict(row) for row in rows]
    conn.close()
    return cols, out


def enforce_sql_safety(sql: str) -> str:
    # Basic read-only guardrails for tool-generated SQL
    #if ";" in sql:
     #   raise ValueError("Multiple statements are not allowed.")
    if not re.match(r"^\s*select\b", sql, re.IGNORECASE):
        raise ValueError("Only SELECT statements are allowed.")
    if re.search(
        r"\b(insert|update|delete|drop|alter|create|replace|pragma|attach|detach|vacuum|begin|commit|rollback)\b",
        sql,
        re.IGNORECASE,
    ):
        raise ValueError("Statement contains a disallowed keyword.")
    if not re.search(r"\bfrom\s+disbursements\b", sql, re.IGNORECASE):
        raise ValueError("Query must read from the disbursements table.")
    if not re.search(r"\blimit\b", sql, re.IGNORECASE):
        sql = sql.rstrip() + " LIMIT 5000"
    return sql


# ---------- Web page ----------
@app.get("/")
def home():
    return render_template("index.html")


# ---------- Data APIs ----------
@app.get("/api/meta")
def meta():
    db = get_db()
    years = [
        r[0]
        for r in db.execute(
            "SELECT DISTINCT FiscalYear FROM disbursements ORDER BY FiscalYear DESC"
        )
    ]
    orgs = [
        r[0]
        for r in db.execute(
            "SELECT DISTINCT Organization FROM disbursements ORDER BY Organization COLLATE NOCASE"
        )
    ]
    return jsonify({"fiscalYears": years, "organizations": orgs})


@app.get("/api/disbursements")
def api_disbursements():
    db = get_db()

    # Pagination
    limit = min(int(request.args.get("limit", 20)), 200)
    offset = max(int(request.args.get("offset", 0)), 0)

    # Filters
    q = request.args.get("q")
    fiscal_year = request.args.get("fiscal_year")
    org = request.args.get("org")
    vendor = request.args.get("vendor")
    date_from = request.args.get("date_from")  # expect YYYY-MM-DD
    date_to = request.args.get("date_to")      # expect YYYY-MM-DD

    # Sorting whitelist
    sort_map = {
        "date": "TransactionDate",
        "amount": "Amount",
        "vendor": "VendorName",
        "org": "Organization",
        "program": "Program",
    }
    sort = sort_map.get(request.args.get("sort", "date"), "TransactionDate")
    direction = request.args.get("dir", "desc").lower()
    dir_sql = "DESC" if direction != "asc" else "ASC"

    where = []
    params = []

    if q:
        where.append(
            "("
            "VendorName LIKE ? OR "
            "Description LIKE ? OR "
            "Organization LIKE ? OR "
            "Program LIKE ? OR "
            "Document LIKE ? OR "
            "SubtotalDescription LIKE ?"
            ")"
        )
        like = f"%{q}%"
        params.extend([like, like, like, like, like, like])

    if fiscal_year:
        where.append("FiscalYear = ?")
        params.append(fiscal_year)

    if org:
        where.append("Organization = ?")
        params.append(org)

    if vendor:
        where.append("VendorName LIKE ?")
        params.append(f"%{vendor}%")

    if date_from:
        where.append("TransactionDate >= ?")
        params.append(date_from)

    if date_to:
        where.append("TransactionDate <= ?")
        params.append(date_to)

    base = "FROM disbursements"
    if where:
        base += " WHERE " + " AND ".join(where)

    # Total count for pagination UI
    total = db.execute(f"SELECT COUNT(*) {base}", params).fetchone()[0]

    select_cols = (
        "Organization, FiscalYear, OrgCode, Program, ProgramCode, SubtotalDescription, "
        "BudgetObjectClass, SortSequence, TransactionDate, DataSource, Document, "
        "VendorName, VendorID, StartDate, EndDate, Description, BudgetObjectCode, Amount"
    )
    sql = f"SELECT {select_cols} {base} ORDER BY {sort} {dir_sql} LIMIT ? OFFSET ?"
    rows = db.execute(sql, (*params, limit, offset)).fetchall()

    return jsonify(
        {
            "rows": [dict(r) for r in rows],
            "total": total,
            "limit": limit,
            "offset": offset,
        }
    )


# ---------- LLM “ask” endpoint (optional) ----------
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY) if (OpenAI and OPENAI_API_KEY) else None
LLM_MODEL = os.environ.get("LLM_MODEL", "gpt-4o-mini")

SCHEMA_TEXT = """
Table: disbursements
Columns:
- Organization TEXT
- FiscalYear INTEGER
- OrgCode TEXT
- Program TEXT
- ProgramCode TEXT
- SubtotalDescription TEXT
- BudgetObjectClass TEXT
- SortSequence INTEGER
- TransactionDate TEXT  -- format: YYYY-MM-DD
- DataSource TEXT
- Document TEXT
- VendorName TEXT
- VendorID TEXT
- StartDate TEXT
- EndDate TEXT
- Description TEXT
- BudgetObjectCode TEXT
- Amount REAL
"""

SYSTEM_PROMPT = f"""
You are a careful data analyst for a single SQLite database. Answer questions by writing safe, efficient SELECT queries against the disbursements table, then explain the results briefly.

Schema:
{SCHEMA_TEXT}

Rules:
- Only read data from the disbursements table. No PRAGMA, no writes, no DDL.
- Prefer aggregates when asked about biggest/smallest/top/bottom (e.g., SUM(Amount) grouped by VendorName).
- Use FiscalYear when the user references a year; otherwise use TransactionDate for date ranges.
- Include a LIMIT (e.g., 5000) in result sets unless user asks for more.
- Choose sensible columns in SELECT (avoid SELECT *).
- For amounts, alias aggregates as total_amount.
- If the question is ambiguous, choose a reasonable interpretation and note it.
- Always exclude vendorName values that are null, empty, or only contain spaces.
When you need database results, call the run_sql tool with a single SELECT statement.
"""


def openai_tools_def():
    return [
        {
            "type": "function",
            "function": {
                "name": "run_sql",
                "description": "Execute a read-only SQLite SELECT on the disbursements table and return rows.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "sql": {
                            "type": "string",
                            "description": "A single SELECT statement that queries the disbursements table.",
                        }
                    },
                    "required": ["sql"],
                },
            },
        }
    ]


@app.post("/api/ask")
def ask():
    if client is None:
        return (
            jsonify({"error": "Server is not configured with OPENAI_API_KEY or openai package is missing"}),
            500,
        )

    data = request.get_json(silent=True) or {}
    question = (data.get("question") or "").strip()
    if not question:
        return jsonify({"error": "Missing 'question'"}), 400

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": question},
    ]

    try:
        first = client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            tools=openai_tools_def(),
            tool_choice="auto",
            temperature=0.1,
        )
        msg = first.choices[0].message

        if getattr(msg, "tool_calls", None):
            tool_call = msg.tool_calls[0]
            fn = tool_call.function
            args = json.loads(fn.arguments or "{}")
            sql = args.get("sql", "")

            try:
                safe_sql = enforce_sql_safety(sql)
                cols, rows = run_sql_readonly(safe_sql)
                tool_payload = {
                    "ok": True,
                    "sql": safe_sql,
                    "columns": cols,
                    "rows": rows,
                    "rowcount": len(rows),
                }
            except Exception as e:
                tool_payload = {"ok": False, "error": str(e), "sql": sql}

            messages.append(
                {
                    "role": "assistant",
                    "content": msg.content or "",
                    "tool_calls": [
                        {
                            "id": tool_call.id,
                            "type": "function",
                            "function": {"name": fn.name, "arguments": fn.arguments},
                        }
                    ],
                }
            )
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(tool_payload),
                }
            )

            second = client.chat.completions.create(
                model=LLM_MODEL,
                messages=messages,
                temperature=0.1,
            )
            final_msg = second.choices[0].message
            return jsonify(
                {
                    "answer": final_msg.content,
                    "sql": tool_payload.get("sql"),
                    "columns": tool_payload.get("columns"),
                    "rows": tool_payload.get("rows"),
                    "rowcount": tool_payload.get("rowcount"),
                    "ok": tool_payload.get("ok", False),
                    "error": tool_payload.get("error"),
                }
            )

        return jsonify({"answer": msg.content})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)