# Legislative Branch Data Map, version 0.1

_We want feedback on this list! Please [create an issue](https://github.com/LibraryOfCongress/Congressional-Hackathon-2025/issues/new) to suggest additions or edits.

This data map is a product of the [Congressional Data Task Force](https://usgpo.github.io/innovation/) that was directed by H. Rept. 118-555 (Legislative Branch Appropriations Bill, FY2025) to create a “Legislative Branch Data Map and Management Plan.” This first rough list was compiled jointly by staff from different Legislative Branch agencies. We hope others can review and contribute to this effort by [creating issue](https://github.com/LibraryOfCongress/Congressional-Hackathon-2025/issues/new)._

## Table of Contents

- [Official - Legislative Branch](#official---legislative-branch)
  - [Main Websites](#main-websites)
  - [Members](#members)
  - [Events](#events)
  - [Legislative](#legislative)
  - [Other](#other)
  - [Senate Nominations](#senate-nominations)
  - [Non-Public / Internal](#non-public--internal)
- [Official - Executive & Agencies](#official---executive--agencies)
  - [Other](#other-1)
- [Unofficial / Civil Society](#unofficial--civil-society)
  - [Legislative](#legislative-1)
  - [Other](#other-2)

## Official - Legislative Branch

### Main Websites

| Source / Tool | Description | Data / Format | Update | Origin | Notes | Tags |
|----|----|----|----|----|----|----|
| <a href="https://house.gov" target="_blank" rel="noopener noreferrer">House.gov</a> | House homepage. Best for: Members, legislation, events. | Web | Daily | House | Maintained by CAO | General / Portal |
| <a href="https://senate.gov" target="_blank" rel="noopener noreferrer">Senate.gov</a> | Senate homepage. Best for: Members, legislation, events. | Web | Daily | Senate |  | General / Portal |
| <a href="https://loc.gov" target="_blank" rel="noopener noreferrer">LOC.gov</a> | Library of Congress. Best for: Research & collections. | Web | Daily | LOC | Includes CRS & Law Library | General / Portal |
| <a href="https://gpo.gov" target="_blank" rel="noopener noreferrer">GPO.gov</a> | GPO portal. Best for: Publications & services. | PDF, XML | Daily | GPO | Entry to govinfo.gov | General / Portal |
| <a href="https://crs.gov" target="_blank" rel="noopener noreferrer">CRS.gov</a> | CRS portal. Best for: Policy analysis. | PDF | As published | LOC (CRS) | Limited public access | Research / Policy |
| <a href="https://clerk.house.gov" target="_blank" rel="noopener noreferrer">Clerk.House.gov</a> | House Clerk. Best for: Members, votes, floor, disclosures. | Web/XML | Daily | House | Primary House data feeds | General / Portal |
| <a href="https://congress.gov" target="_blank" rel="noopener noreferrer">Congress.gov</a> | Bill tracker. Best for: Legislative activity. | XML, JSON, USLM | Near real-time | LOC | Maintained by LOC | Legislation / Tracking |
| <a href="https://govinfo.gov" target="_blank" rel="noopener noreferrer">GovInfo.gov</a> | Primary docs. Best for: Bills, laws, reports. | XML, TXT, USLM | Daily | GPO | Bulk & API access available | Legislation / Docs |
| <a href="https://cbo.gov" target="_blank" rel="noopener noreferrer">CBO.gov</a> | CBO portal. Best for: Cost estimates & reports. | PDF, XLSX | As published | CBO |  | Legislation / Fiscal Analysis |
| <a href="https://gao.gov" target="_blank" rel="noopener noreferrer">GAO.gov</a> | GAO portal. Best for: Audits & evaluations. | PDF, XLSX | As published | GAO |  | Oversight / GAO |

### Members

| Source / Tool | Description | Data / Format | Update | Origin | Notes | Tags |
|----|----|----|----|----|----|----|
| <a href="https://member-info.house.gov/members.xml" target="_blank" rel="noopener noreferrer">Member Info</a> | House members. Best for: Member roster. | XML | Daily | House | Based on Clerk and CAO data; updated after memberData.xml is updated | Members / IDs |
| <a href="https://clerk.house.gov/xml/lists/MemberData.xml" target="_blank" rel="noopener noreferrer">Clerk MemberData XML</a> | House members. Best for: Member list. | XML | Daily | House | Published by House Clerk | Members / IDs |
| <a href="https://bioguide.congress.gov" target="_blank" rel="noopener noreferrer">Bioguide</a> | Member directory. Best for: Unique IDs & photos. | XML, JSON | As updated | LOC | Maintained by LOC & historians | Members / IDs |
| <a href="https://www.senate.gov/general/committee_membership/" target="_blank" rel="noopener noreferrer">Senate committee memberships</a> | Committee rosters. Best for: Membership by committee. | Web/XML | As updated | Senate |  | Committees / Membership |
| <a href="https://www.senate.gov/general/contact_information/senators_cfm.xml" target="_blank" rel="noopener noreferrer">Senate contact info XML</a> | Senator contacts. Best for: Official info. | XML | As updated | Senate |  | Members / Contacts |
| <a href="https://www.senate.gov/legislative/LIS_MEMBER/cvc_member_data.xml" target="_blank" rel="noopener noreferrer">Senate LIS Member Data</a> | LIS data feed. Best for: Senate members. | XML | Daily | Senate | IDs differ from Bioguide | Members / IDs |

### Events

| Source / Tool | Description | Data / Format | Update | Origin | Notes | Tags |
|----|----|----|----|----|----|----|
| <a href="https://clerk.house.gov/floorsummary/floor-download.aspx" target="_blank" rel="noopener noreferrer">House Floor Summary</a> | Floor summary. Best for: House floor actions. | Various | Real-time | House | Download formats available | Legislation / Floor |
| <a href="https://docs.house.gov/committee" target="_blank" rel="noopener noreferrer">Docs.House.gov Committee</a> | Committee repository. Best for: Hearings & docs. | XML | Daily | House | Covers ~15 years | Committees / Hearings |
| <a href="https://www.senate.gov/legislative/2025_schedule.xml" target="_blank" rel="noopener noreferrer">Senate Schedule XML</a> | Senate schedule. Best for: Floor calendar. | XML | Daily | Senate |  | Legislation / Floor |
| <a href="https://www.senate.gov/general/committee_schedules/hearings.xml" target="_blank" rel="noopener noreferrer">Senate Hearings XML</a> | Hearing schedule. Best for: Senate committees. | XML | Daily | Senate |  | Committees / Hearings |
| <a href="https://www.senate.gov/legislative/LIS/floor_activity/" target="_blank" rel="noopener noreferrer">Senate LIS Floor Activity</a> | Floor activity. Best for: Senate floor actions. | XML | Real-time | Senate |  | Legislation / Floor |

### Legislative

| Source / Tool | Description | Data / Format | Update | Origin | Notes | Tags |
|----|----|----|----|----|----|----|
| <a href="https://crsreports.congress.gov/AppropriationsStatusTable" target="_blank" rel="noopener noreferrer">Appropriations Status Tables (CRS)</a> | Appropriations status overview. Best for: Bills, reports, JES. | HTML/PDF | In-session | LOC (CRS) | No line-item breakout | Legislation / Appropriations |
| <a href="https://clerk.house.gov/Votes" target="_blank" rel="noopener noreferrer">House Clerk – Roll Call Votes</a> | Floor votes. Best for: Member positions (House). | XML | Real-time | House | IDs = Bioguide | Legislation / Votes |
| <a href="https://www.senate.gov/legislative/votes_new.htm" target="_blank" rel="noopener noreferrer">Senate – Roll Call Votes</a> | Floor votes. Best for: Member positions (Senate). | XML | Real-time | Senate | IDs = LIS | Legislation / Votes |
| <a href="https://www.congress.gov/116/crpt/hrpt718/CRPT-116hrpt718.pdf" target="_blank" rel="noopener noreferrer">House Activity Report (End of Congress)</a> | Committee roll-up. Best for: Hearings, markups, votes. | PDF | End of Congress | House | Summarizes all committee work | Committees / Reporting |
| <a href="https://congress.gov" target="_blank" rel="noopener noreferrer">Congress.gov</a> | Canonical bill tracker. Best for: Bill status & summaries. | XML, JSON, USLM | Near real-time | LOC | Often lags by 1+ day | Legislation / Tracking |
| <a href="https://api.congress.gov" target="_blank" rel="noopener noreferrer">Congress.gov API</a> | Programmatic bill API. Best for: Data feeds. | XML, JSON, USLM | Near real-time | LOC |  | Legislation / API |
| <a href="https://www.govinfo.gov/bulkdata" target="_blank" rel="noopener noreferrer">GPO GovInfo Bulk</a> | Primary legislative docs. Best for: Bill text in bulk. | USLM, XML, TXT | Daily | GPO | Authoritative text | Legislation / Docs |
| <a href="https://docs.house.gov/floor" target="_blank" rel="noopener noreferrer">Docs.House.gov Floor</a> | Floor schedule/docs. Best for: Bills set for House floor. | XML | Real-time | House | Weekly schedule feed | Legislation / Floor |
| <a href="https://rules.house.gov" target="_blank" rel="noopener noreferrer">House Rules Committee</a> | Rules & amendments. Best for: Floor process docs. | XML, PDF | Per meeting | House | Includes all offered amendments | Legislation / Floor |
| <a href="https://api.congress.gov" target="_blank" rel="noopener noreferrer">Congress.gov API</a> | Bill API. Best for: Bill/member data. | XML, JSON, USLM | Near real-time | LOC |  | Legislation / API |
| <a href="https://api.govinfo.gov/docs/" target="_blank" rel="noopener noreferrer">GovInfo API</a> | Document API. Best for: Legislation & other docs. | API | Real-time | GPO |  | Legislation / API |
| <a href="https://congress.gov" target="_blank" rel="noopener noreferrer">Congress.gov</a> | Legislative tracker. Best for: Bills, laws, summaries. | XML, JSON, USLM | Near real-time | LOC | Sometimes lags | Legislation / Tracking |
| <a href="https://uscode.house.gov" target="_blank" rel="noopener noreferrer">US Code (OLRC)</a> | US Code. Best for: Statutory text. | XML, XHTML | As updated | House (OLRC) | Maintained by OLRC | Legislation / Law |
| <a href="https://clerk.house.gov/legislative/legvotes.aspx" target="_blank" rel="noopener noreferrer">House Clerk – LegVotes</a> | Roll call votes. Best for: House floor votes. | XML | Real-time | House | IDs = Bioguide | Legislation / Votes |
| <a href="https://docs.house.gov/floor" target="_blank" rel="noopener noreferrer">Docs.House.gov Floor</a> | Floor schedule/docs. Best for: Bills on floor. | XML | Real-time | House |  | Legislation / Floor |

### Other

| Source / Tool | Description | Data / Format | Update | Origin | Notes | Tags |
|----|----|----|----|----|----|----|
| <a href="https://live.house.gov" target="_blank" rel="noopener noreferrer">House Live Video</a> | Streaming video. Best for: House floor & events. | Streaming | Real-time | House |  | Media / Video |
| <a href="https://www.senate.gov/legislative/floor_activity_pail.htm" target="_blank" rel="noopener noreferrer">Senate Floor Video</a> | Streaming video. Best for: Senate floor. | Streaming | Real-time | Senate |  | Media / Video |
| <a href="https://crsreports.congress.gov" target="_blank" rel="noopener noreferrer">CRS Reports</a> | CRS portal. Best for: Policy reports. | PDF | Weekly | LOC (CRS) | Limited set | Research / Policy |
| <a href="https://history.house.gov" target="_blank" rel="noopener noreferrer">House History</a> | Historical resources. Best for: House history. | Web | As needed | House |  | History |
| <a href="https://xml.house.gov" target="_blank" rel="noopener noreferrer">XML.House.gov</a> | Data standards. Best for: XML/USLM schemas. | Web | As needed | House | Technical reference | Tools / Standards |
| <a href="https://oce.house.gov" target="_blank" rel="noopener noreferrer">OCE House</a> | Office of Congressional Ethics. Best for: Ethics oversight. | Web | As needed | House |  | Ethics |
| <a href="https://aoc.gov" target="_blank" rel="noopener noreferrer">AOC.gov</a> | Architect of Capitol. Best for: Facilities info. | Web | As needed | AOC |  | Admin / Facilities |
| <a href="https://visitthecapitol.gov" target="_blank" rel="noopener noreferrer">VisitTheCapitol.gov</a> | Visitor portal. Best for: Tours & info. | Web | As needed | AOC |  | Public / Visitor |
| <a href="https://www.senate.gov/general/XML.htm" target="_blank" rel="noopener noreferrer">Senate XML Resources</a> | Senate XML. Best for: Data resources. | XML | Various | Senate |  | Tools / Standards |
| <a href="https://domewatch.us" target="_blank" rel="noopener noreferrer">DomeWatch</a> | House Dem floor info. Best for: Floor schedule & updates. | Web | Daily | Civil Society | Leadership tool | Legislation / Floor |
| <a href="https://www.loc.gov/collections/publications-of-the-law-library-of-congress/about-this-collection/" target="_blank" rel="noopener noreferrer">Law Library of Congress</a> | Legal reports. Best for: Foreign/comparative law. | PDF/HTML | Rolling | LOC | Specialized foreign law topics | Research / Law |
| <a href="https://bioguide.congress.gov" target="_blank" rel="noopener noreferrer">Bioguide</a> | Member directory. Best for: Unique IDs & photos. | XML, JSON | As updated | LOC | Crosswalk with Senate LIS needed | Members / IDs |
| <a href="https://directory.house.gov" target="_blank" rel="noopener noreferrer">House Directory</a> | Staff directory. Best for: Staff contacts. | XML, JSON | Daily | House | Exportable contact info | Members / Staff |
| <a href="https://usgpo.github.io/innovation/" target="_blank" rel="noopener noreferrer">GPO Innovation Hub</a> | Standards hub. Best for: USLM/XML resources. | Web | Ongoing | GPO | Links to XML WG | Tools / Standards |
| <a href="https://www.house.gov/the-house-explained/open-government/statement-of-disbursements" target="_blank" rel="noopener noreferrer">House Statement of Disbursements</a> | Office expenditures. Best for: House-level spending. | CSV, PDF | Quarterly | House | Recent years are spreadsheets | Admin / Finance |
| <a href="https://www.senate.gov/legislative/common/generic/report_secsen.htm" target="_blank" rel="noopener noreferrer">Senate SOPOEA</a> | Office expenditures. Best for: Senate-level spending. | PDF | Quarterly | Senate | Stays in PDF | Admin / Finance |
| <a href="https://www.govinfo.gov/bulkdata/CFR" target="_blank" rel="noopener noreferrer">CFR Bulk</a> | Code of Fed Regs. Best for: Regulatory text. | XML | Annual | GPO |  | Regulations / CFR |
| <a href="https://www.govinfo.gov/bulkdata/ECFR" target="_blank" rel="noopener noreferrer">eCFR Bulk</a> | eCFR. Best for: Daily regulatory updates. | XML | Daily | GPO |  | Regulations / eCFR |
| <a href="https://www.govinfo.gov/bulkdata/FR" target="_blank" rel="noopener noreferrer">Federal Register Bulk</a> | Federal Register. Best for: Rules, notices. | XML | Daily | GPO |  | Regulations / FR |
| <a href="https://www.govinfo.gov/bulkdata/GOVMAN" target="_blank" rel="noopener noreferrer">Government Manual</a> | Gov’t Manual. Best for: Agency profiles. | XML | As updated | GPO |  | Reference / Agencies |
| <a href="https://www.govinfo.gov/bulkdata/HMAN" target="_blank" rel="noopener noreferrer">House Manual</a> | House Manual. Best for: Rules & precedents. | XML | Biennial | GPO |  | Reference / House Rules |
| <a href="https://www.govinfo.gov/bulkdata/PAI" target="_blank" rel="noopener noreferrer">Privacy Act Issuances</a> | Privacy Act notices. Best for: System notices. | XML | As updated | GPO |  | Reference / Privacy Act |
| <a href="https://www.govinfo.gov/bulkdata/PPP" target="_blank" rel="noopener noreferrer">Public Papers of Presidents</a> | Presidential papers. Best for: Speeches & statements. | XML | As published | GPO |  | Reference / Presidency |

### Senate Nominations

| Source / Tool | Description | Data / Format | Update | Origin | Notes | Tags |
|----|----|----|----|----|----|----|
| <a href="https://www.senate.gov/legislative/LIS/nominations/NomCivilianPendingCommittee.xml" target="_blank" rel="noopener noreferrer">Civilian pending in committee</a> | Nominations feed. Best for: Civilian pending in committee. | XML | Daily | Senate |  | Nominations / Senate |
| <a href="https://www.senate.gov/legislative/LIS/nominations/NomPrivileged.xml" target="_blank" rel="noopener noreferrer">Privileged nominations</a> | Nominations feed. Best for: Privileged nominations. | XML | Daily | Senate |  | Nominations / Senate |
| <a href="https://www.senate.gov/legislative/LIS/nominations/NomCivilianConfirmed.xml" target="_blank" rel="noopener noreferrer">Civilian confirmed</a> | Nominations feed. Best for: Civilian confirmed. | XML | Daily | Senate |  | Nominations / Senate |
| <a href="https://www.senate.gov/legislative/LIS/nominations/NomCivilianPendingCalendar.xml" target="_blank" rel="noopener noreferrer">Civilian pending on calendar</a> | Nominations feed. Best for: Civilian pending on calendar. | XML | Daily | Senate |  | Nominations / Senate |
| <a href="https://www.senate.gov/legislative/LIS/nominations/NomNonCivilianPendingCommittee.xml" target="_blank" rel="noopener noreferrer">Military pending in committee</a> | Nominations feed. Best for: Military pending in committee. | XML | Daily | Senate |  | Nominations / Senate |
| <a href="https://www.senate.gov/legislative/LIS/nominations/NomNonCivilianConfirmed.xml" target="_blank" rel="noopener noreferrer">Military confirmed</a> | Nominations feed. Best for: Military confirmed. | XML | Daily | Senate |  | Nominations / Senate |
| <a href="https://www.senate.gov/legislative/LIS/nominations/NomNonCivilianPendingCalendar.xml" target="_blank" rel="noopener noreferrer">Military pending on calendar</a> | Nominations feed. Best for: Military pending on calendar. | XML | Daily | Senate |  | Nominations / Senate |
| <a href="https://www.senate.gov/legislative/LIS/nominations/NomWithdrawn.xml" target="_blank" rel="noopener noreferrer">Withdrawn nominations</a> | Nominations feed. Best for: Withdrawn nominations. | XML | Daily | Senate |  | Nominations / Senate |
| <a href="https://www.senate.gov/legislative/LIS/nominations/NomFailedOrReturned.xml" target="_blank" rel="noopener noreferrer">Failed/returned nominations</a> | Nominations feed. Best for: Failed/returned nominations. | XML | Daily | Senate |  | Nominations / Senate |

### Non-Public / Internal

| Source / Tool | Description | Data / Format | Update | Origin | Notes | Tags |
|----|----|----|----|----|----|----|
| <a href="(internal)" target="_blank" rel="noopener noreferrer">Webster (Senate intranet)</a> | Senate intranet. Best for: Staff operations. |  |  | Senate (Internal) |  | Internal / Staff |
| <a href="(internal)" target="_blank" rel="noopener noreferrer">Housenet (House intranet)</a> | House intranet. Best for: Staff operations. |  |  | House (Internal) |  | Internal / Staff |
| <a href="https://memrec.house.gov" target="_blank" rel="noopener noreferrer">MemRec</a> | Member/staff photos. Best for: Official portraits. |  | Daily | House (Internal) | Clerk-managed | Members / Staff |
| <a href="https://calendar.house.gov" target="_blank" rel="noopener noreferrer">House Central Calendar</a> | Floor + committee calendar. Best for: Scheduling. | JSON | Real-time | House (Internal) | Central calendar feed | Legislation / Calendar |
| <a href="https://legidex.house.gov" target="_blank" rel="noopener noreferrer">LegiDex</a> | Staffer registry. Best for: Internal staff data. |  | Daily | House (Internal) | CAO-managed | Members / Staff |

## Official - Executive & Agencies

### Other

| Source / Tool | Description | Data / Format | Update | Origin | Notes | Tags |
|----|----|----|----|----|----|----|
| <a href="https://www.whitehouse.gov/omb/budget" target="_blank" rel="noopener noreferrer">OMB Budget &amp; Appendix</a> | Admin budget proposal. Best for: Proposed bill-like text & toplines. | PDF, data | Annual | OMB | Appendix has detailed tables | Spending / Budget |
| <a href="https://www.usaspending.gov/agency" target="_blank" rel="noopener noreferrer">Congressional Justifications (CBJs)</a> | Budget justifications. Best for: Program-level requests. | PDF, data | Annual | Agencies | FY24+ Transparency Act requires posting | Spending / Budget |
| <a href="https://www.usaspending.gov/" target="_blank" rel="noopener noreferrer">USAspending.gov</a> | Award implementation. Best for: Grants & contracts data. | API, data | Rolling | Treasury | Shows execution of enacted spending | Spending / Execution |
| <a href="https://oversight.gov" target="_blank" rel="noopener noreferrer">Oversight.gov</a> | IG reports hub. Best for: Audits & inspections. | PDF | Rolling | CIGIE | Coverage gaps; older reports missing | Oversight / IG Reports |
| <a href="https://flatgithub.com/cisagov/dotgov-data" target="_blank" rel="noopener noreferrer">CISA DotGov data</a> | DotGov domains. Best for: Federal IT/security. | CSV | Rolling | CISA | Managed by DHS | Tech / Security |
| <a href="https://innovations.gao.gov" target="_blank" rel="noopener noreferrer">GAO Innovation Lab</a> | GAO Innovations. Best for: GAO projects. | Web | As needed | GAO |  | Oversight / GAO |

## Unofficial / Civil Society

### Legislative

| Source / Tool | Description | Data / Format | Update | Origin | Notes | Tags |
|----|----|----|----|----|----|----|
| <a href="https://govtrack.us" target="_blank" rel="noopener noreferrer">GovTrack.us</a> | Bill tracker. Best for: Legislative activity. | Web | Rolling | Civic Tech | Analytics + visualizations | Legislation / Tracking |
| <a href="https://www.senatecommitteehearings.com/transcripts" target="_blank" rel="noopener noreferrer">Senate Video Links (Lincoln Network)</a> | Senate video links. Best for: Committee footage archive. | Links | Static | Civil Society | ~20 years of coverage | Media / Video |

### Other

| Source / Tool | Description | Data / Format | Update | Origin | Notes | Tags |
|----|----|----|----|----|----|----|
| <a href="https://www.brookings.edu/multi-chapter-report/vital-statistics-on-congress" target="_blank" rel="noopener noreferrer">Brookings Vital Stats</a> | Staff stats. Best for: Long-term staffing trends. | Tables | Periodic | Think Tank | Commonly cited; caveats | Staff / Research |
| <a href="https://congressionaldata.org/a-biased-yet-reliable-guide-to-sources-of-information-and-data-about-congress/" target="_blank" rel="noopener noreferrer">CongressionalData.org Guide</a> | Meta guide. Best for: Orientation to data sources. | Web | Periodic | Civic Tech | Curated overview | Meta / Guide |
| <a href="https://opensecrets.org" target="_blank" rel="noopener noreferrer">OpenSecrets</a> | Money in politics. Best for: Campaign & lobbying data. | Web, CSV | Rolling | Civil Society | Outside experts say best starting point for finance data | Money / Ethics |
| <a href="https://www.everycrsreport.com" target="_blank" rel="noopener noreferrer">EveryCRSReport.com</a> | CRS mirror + data. Best for: Better search & archive. | PDF + data | Rolling | Civic Tech | More coverage; data extracts | Research / Policy |
| <a href="https://github.com/unitedstates" target="_blank" rel="noopener noreferrer">UnitedStates Project</a> | Data/tools hub. Best for: IDs, scrapers, metadata. | GitHub | Ongoing | Civic Tech | Maintained by volunteers | Tools / IDs |
| <a href="https://projects.propublica.org/api-docs/congress-api/" target="_blank" rel="noopener noreferrer">ProPublica Congress API</a> | Member/bill API. Best for: Programmatic info. | JSON | Daily | ProPublica | Includes Represent & DC Inbox | Legislation / API |
| <a href="https://www.dcinbox.com/" target="_blank" rel="noopener noreferrer">DC Inbox</a> | Member enewsletters. Best for: Member email messages. | Web | Rolling | ProPublica | Useful for messaging analysis | Comms / Messaging |
