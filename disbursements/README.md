# Congressional Hackathon 7.0

## Coding Breakout Group - Disbursements team

We used the house official disbursements as an initial data source. **[House Disbursement Reports](https://www.house.gov/the-house-explained/open-government/statement-of-disbursements)**. That data is in CSVs broken down by quarter. We did the following with the data:

1. Normalized dates in the CSV to the ISO format in excel

1. Inserted them into a Sqlite database and set a schema for the table with appropriate data types

```
CREATE TABLE IF NOT EXISTS disbursements (
ID INTEGER PRIMARY KEY NOT NULL,
Organization NVARCHAR(500),
FiscalYear NVARCHAR(100),
OrgCode NVARCHAR(100),
Program NVARCHAR(500),
ProgramCode NVARCHAR(100),
SubtotalDescription NVARCHAR(500),
BudgetObjectClass INT,
SortSequence NVARCHAR(100),
TransactionDate DATETIME,
DataSource NVARCHAR(100),
Document NVARCHAR(100),
VendorName NVARCHAR(2000),
VendorID INT,
StartDate DATETIME,
EndDate DATETIME,
Description NVARCHAR(2000),
BudgetObjectCode INT,
Amount DECIMAL
);
```

1. Created a temporary table to upload the csv data and then added the data to the disbursements table with the appropriate schema

Grab data from the CSV
```.import april-june2025.csv disbursements-temp```

Move the data to the permanent table

``` 
INSERT INTO disbursements (Organization, FiscalYear, OrgCode, Program, ProgramCode, SubtotalDescription, BudgetObjectClass, SortSequence, TransactionDate, DataSource, Document, VendorName, VendorID, StartDate, EndDate, Description, BudgetObjectCode, Amount)
SELECT * FROM disbursements-temp

DROP TABLE disbursements-temp
```

1. For the hackathon we've only used the most recent quarter, but you can repeat the above process to grab additional quarters of data to expand the data set. Would then likely need to work on indexing and performance as the data set gets larger.

1. Now that we have the data in a DB we wrote a simple python flask app to search and filter through the data in a structured way.

1. Once that worked we expanded the flask app to add an LLM prompt box at the top to ask specific questions of the data set. The data has a lot of null values, empty values, and rows with multiple spaces, had to tweak the prompt to remove those from queries to get better answers. Longer term may want to try and clean the data itself.

1. Now you can ask general questions about the data to the LLM and it will try its best to answer it.

## To Run

1. Work done on a mac and works locally, no testing or guarantees in any other environment ;)

1. python -m venv venv
1. source venv/bin/activate
1. pip install -r requirements.txt
1. FLASK_APP=app.py flask run (then open http://127.0.0.1:5000)

## Future Work

1. Grab FEC contributor data for house members to see if there's any overlap between disbursements and campaign contributions. Mapping organizations will be a challenge.

