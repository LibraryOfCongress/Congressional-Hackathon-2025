# Legislative Branch Data Map, version 0.1

_**We want feedback on this list! Please [create an issue](https://github.com/LibraryOfCongress/Congressional-Hackathon-2025/issues/new) to suggest additions or edits.**_

This data map is a product of the [Congressional Data Task Force](https://usgpo.github.io/innovation/) that was directed by H. Rept. 118-555 (Legislative Branch Appropriations Bill, FY2025) to create a “Legislative Branch Data Map and Management Plan.” This first rough list was compiled jointly by staff from different Legislative Branch agencies. We hope others can review and contribute to this effort by [creating issue](https://github.com/LibraryOfCongress/Congressional-Hackathon-2025/issues/new).

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

| Source / Tool | Description | Data | Update | Origin | Notes | Tags |
|----|----|----|----|----|----|----|
| [House.gov](https://house.gov) | House homepage. Best for: Members, legislation, events. | Web | Daily | House | Maintained by CAO | General / Portal |
| [Senate.gov](https://senate.gov) | Senate homepage. Best for: Members, legislation, events. | Web | Daily | Senate |  | General / Portal |
| [Congress.gov](https://congress.gov) | Bill tracker. Best for: Legislative activity. | XML, JSON, USLM | Near real-time | LOC | Maintained by LOC | Legislation / Tracking |
| [House Live Video](https://live.house.gov) | Streaming video. Best for: House floor & events. | Streaming | Real-time | House |  | Media / Video |
| [Clerk.House.gov](https://clerk.house.gov) | House Clerk. Best for: Members, Member photos, votes, floor, disclosures. | Web/XML | Daily | House | Primary House data feeds | General / Portal |
| [LOC.gov](https://loc.gov) | Library of Congress. Best for: Research & collections. | Web | Daily | LOC | Includes CRS & Law Library | General / Portal |
| [CRS.gov](https://crs.gov) | CRS portal. Best for: Policy analysis. | PDF | As published | LOC (CRS) | No public access | Research / Policy |
| [Law Library of Congress](https://www.loc.gov/research-centers/law-library-of-congress/about-this-research-center/) | Law Library of Congress. Best for: Policy analysis. | Many kinds | As published | LOC (Law) | Public access | Research / Policy |
| [Copyright Office](https://www.copyright.gov/) | U.S. Copyright Office Best for: Copyright policy. | Many kinds | As published | LOC (Copyright) | Public access | Policy |
| [GPO.gov](https://gpo.gov) | GPO portal. Best for: Publications & services. | PDF, XML | Daily | GPO | Entry to govinfo.gov | General / Portal |
| [GovInfo.gov](https://govinfo.gov) | Primary docs. Best for: Bills, laws, reports. | XML, TXT, USLM | Daily | GPO | Bulk & API access available | Legislation / Docs |
| [CBO.gov](https://cbo.gov) | CBO portal. Best for: Cost estimates & reports. | PDF, XLSX | As published | CBO |  | Legislation / Fiscal Analysis |
| [GAO.gov](https://gao.gov) | GAO portal. Best for: Audits & evaluations. | PDF, XLSX | As published | GAO |  | Oversight / GAO |
| [U.S. Capitol Police](https://www.uscp.gov/) | U.S. Capitol Police. Best for: Crime statistics and IG Reports. | PDF, text | As published | USCP |  | Legislative Branch Security |
| [Office of Congressional Workplace Rights](https://www.ocwr.gov/) | OCWR. Best for: Workplace safety data. | PDF, text | As published | OCWR |  | Legislative Branch Operations |

### Members

| Source / Tool | Description | Data | Update | Origin | Notes | Tags |
|----|----|----|----|----|----|----|
| [Member Info](https://member-info.house.gov/members.xml) | House members. Best for: Member roster. | XML | Daily | House | Based on Clerk and CAO data; updated after memberData.xml is updated | Members / IDs |
| [Clerk MemberData XML](https://clerk.house.gov/xml/lists/MemberData.xml) | House members. Best for: Member list. | XML | Daily | House | Published by House Clerk | Members / IDs |
| [Clerk Financial Disclosure Reports](https://disclosures-clerk.house.gov/FinancialDisclosure) | House members. Best for: Member financial disclosure reports. | PDF | Daily | House | Published by House Clerk | Members / Ethics |
| [House Clerk Foreign Travel Reports](https://disclosures-clerk.house.gov/ForeignTravel) | House members. Best for: Foreign travel reports. | PDF and Text | Daily | House | Published by House Clerk | Members / Travel |
| [House Clerk Gift Travel Filings](https://disclosures-clerk.house.gov/GiftTravelFilings) | House members. Best for: Gift travel filings. | ZIP | Annual | House | Published by House Clerk | Members / Travel |
| [House Clerk Unsolicited Mass Communications](https://masscommsdisclosure.house.gov/) | House members. Best for: Mass communications. | PDF  | Daily | House | Published by House Clerk | Members / Communications |
| [House Post-Employment Notifications](https://disclosures-clerk.house.gov/PostEmploymentNotification) | House members. Best for: Post Employment Communications. | ZIP  |  | House | Published by House Clerk | Members / Ethics |
| [House Lobbying Disclosure](https://lobbyingdisclosure.house.gov/) | Lobbyists. Best for: Lobbying filings and campaign contributions. | XML  |  | House | Published by House Clerk | Members / Ethics |
| [Bioguide](https://bioguide.congress.gov) | Member directory. Best for: Unique IDs & photos. | XML, JSON | As updated | LOC | Maintained by LOC & historians | Members / IDs |
| [Senate contact info XML](https://www.senate.gov/general/contact_information/senators_cfm.xml) | Senator contacts. Best for: Official info. | XML | As updated | Senate |  | Members / Contacts |
| [Senate LIS Member Data](https://www.senate.gov/legislative/LIS_MEMBER/cvc_member_data.xml) | LIS data feed. Best for: Senate members. | XML | Daily | Senate | IDs differ from Bioguide | Members / IDs |
| [Senate Financial Disclosure Database](https://efdsearch.senate.gov/search/home/) | Senate electronic Financial Disclosures. Best for: reviewing financial disclosures from 2012-present for members and candidates. | PDF | Daily | Senate |  | Members / candidates |
| [Senate Private Sponsor Travel Database](https://www.senate.gov/legislative/lobbyingdisc.htm#lobbyingdisc=lda) | Senate travel gift rule disclosures. Best for: reviewing outside payments for travel. | PDF and download in bulk | Daily | Senate |  | Members / candidates |
| [Senate Lobbying Disclosure](https://lda.senate.gov/system/public/) | Senate lobbying disclosure act reports: registrations, quarterly activity, and contribution reports. Best for: lobbying disclosures. | Database and API  | Daily | Senate | Ethics | Lobbyists |
| [Senate Post Employment Lobbying Disclosure](https://www.senate.gov/pagelayout/legislative/g_three_sections_with_teasers/lobbyingdisc.htm) | Senate post employment lobbying restrictions. Best for: identifying former staff lobbying black-out period. | HTMML  | Annual | Senate | Ethics | Former staff |

### Committees

| Source / Tool | Description | Data | Update | Origin | Notes | Tags |
|----|----|----|----|----|----|----|
| [Docs.House.gov Committee](https://docs.house.gov/committee) | Committee repository. Best for: Hearings & docs. | XML | Daily | House | Covers \~15 years | Committees / Hearings |
| [Senate Hearings XML](https://www.senate.gov/general/committee_schedules/hearings.xml) | Hearing schedule. Best for: Senate committees. | XML | Daily | Senate |  | Committees / Hearings |
| [House Committee Reports by Congress](https://cha.house.gov/committee-reports) | Monthly reports on expenditures by committee. Best for: House committee spending. | PDF | Monthly | House | Stays in PDF | Admin / Finance |
| [Unique IDs for committees and subcommittees](https://clerk.house.gov/xml/lists/MemberData.xml) | Committees and subcommittees have unique IDs. Control+F for appropriations to get a list of all the IDs. Best for: unqiue identifiers for committees. | XML |  | House |  | Committees |
| [Senate committee memberships](https://www.senate.gov/general/committee_membership/committee_memberships_SSAP.xml) | Committee rosters. Best for: Membership by committee. | Web/XML | As updated | Senate |  | Committees / Membership |
| [Reports due to Congress from agencies](https://www.gpo.gov/how-to-work-with-us/agency/congressionally-mandated-reports) | Mandated agency reports to congress. Best for: oversight. | API, PDF | As updated | House + Senate |  | Reports |



### Events

| Source / Tool | Description | Data | Update | Origin | Notes | Tags |
|----|----|----|----|----|----|----|
| [Senate Floor Video](https://www.senate.gov/legislative/floor_activity_pail.htm) | Streaming video. Best for: Senate floor. | Streaming | Real-time | Senate |  | Media / Video |
| [House Floor Summary](https://clerk.house.gov/floorsummary/floor-download.aspx) | Floor summary. Best for: House floor actions. | Various | Real-time | House | Download formats available | Legislation / Floor |
| [Senate Schedule XML](https://www.senate.gov/legislative/2025_schedule.xml) | Senate schedule. Best for: Floor calendar. | XML | Daily | Senate |  | Legislation / Floor |
| [Senate LIS Floor Activity](https://www.senate.gov/legislative/LIS/floor_activity/) | Floor activity. Best for: Senate floor actions. | XML | Real-time | Senate |  | Legislation / Floor |

### Legislative

| Source / Tool | Description | Data | Update | Origin | Notes | Tags |
|----|----|----|----|----|----|----|
| [Appropriations Status Tables (CRS)](https://crsreports.congress.gov/AppropriationsStatusTable) | Appropriations status overview. Best for: Bills, reports, JES. | HTML/PDF | In-session | LOC (CRS) | No line-item breakout | Legislation / Appropriations |
| [House Clerk Roll Call Votes](https://clerk.house.gov/Votes) | Floor votes. Best for: Member positions (House). | XML | Near real-time | House | IDs = Bioguide | Legislation / Votes |
| [Senate Roll Call Votes](https://www.senate.gov/legislative/votes_new.htm) | Floor votes. Best for: Member positions (Senate). | XML | Near real-time | Senate | IDs = LIS | Legislation / Votes |
| [House Activity Report (End of Congress)](https://www.congress.gov/116/crpt/hrpt718/CRPT-116hrpt718.pdf) | Committee roll-up. Best for: Hearings, markups, votes. | PDF | End of Congress | House | Summarizes all committee work | Committees / Reporting |
| [Congress.gov API](https://api.congress.gov) | API of most datasets on Congress.gov. | XML, JSON, USLM | Near real-time | LOC |  | Legislation / API |
| [GPO GovInfo Bulk](https://www.govinfo.gov/bulkdata) | Primary legislative docs. Best for: Bill text in bulk. | USLM, XML, TXT | Daily | GPO | Authoritative text | Legislation / Docs |
| [Docs.House.gov Floor](https://docs.house.gov/floor) | Floor schedule/docs. Best for: Bills set for House floor. | XML | Real-time | House | Weekly schedule feed | Legislation / Floor |
| [House Rules Committee](https://rules.house.gov) | Rules & amendments. Best for: Floor process docs. | XML, PDF | Per meeting | House | Includes all offered amendments | Legislation / Floor |
| [GovInfo API](https://api.govinfo.gov/docs/) | Document API. Best for: Legislation & other docs. | API | Real-time | GPO |  | Legislation / API |
| [US Code (OLRC)](https://uscode.house.gov) | US Code. Best for: Statutory text. | XML, XHTML | As updated | Office of Law Revision Counsel (OLRC) | Maintained by House OLRC | Legislation / Law |
| [Docs.House.gov Floor](https://docs.house.gov/floor) | Floor schedule/docs. Best for: Bills on floor. | XML | Real-time | House |  | Legislation / Floor |

### Other Legislative

| Source / Tool | Description | Data | Update | Origin | Notes | Tags |
|----|----|----|----|----|----|----|
| [CRS Reports](https://crsreports.congress.gov) | CRS portal. Best for: Policy reports. | PDF | Weekly | LOC (CRS) | Limited set | Research / Policy |
| [Law Library Legal Reports](https://www.loc.gov/research-centers/law-library-of-congress/legal-reports/) | Law Library of Congress Legal Reports. Best for: Foreign law policy analysis. | PDF | As published | LOC (Law Library) | Public access | Research / Policy |
| [GAO restricted reports](https://www.gao.gov/reports-testimonies/restricted) | List of non-public GAO reports. Best for: Audits & evaluations. | TXT | As published | GAO |  | Oversight / GAO |
| [GAO appropriations decisions](https://www.gao.gov/legal/appropriations-law/search) | GAO's Office of General Counsel issues decisions and opinions on appropriations law | PDF | As published | GAO |  | Appropriations / GAO |
| [GAO bid protest decisions and docket](https://www.gao.gov/legal/bid-protests/search) | GAO forum for resolving bid protests | PDF | As published | GAO |  | Procurement / GAO |
| [GAO legal opinions](https://www.gao.gov/legal/other-legal-work/decisions-and-faqs) | Various legal GAO opinions, including on application of CRA and impoundment.  | PDF | As published | GAO |  | Various / GAO |
| [House History](https://history.house.gov) | Historical resources. Best for: House history. | Web | As needed | House |  | History |
| [XML.House.gov](https://xml.house.gov) | Data standards. Best for: XML/USLM schemas. | Web | As needed | House | Technical reference | Tools / Standards |
| [OCE House](https://oce.house.gov) | Office of Congressional Ethics. Best for: Ethics oversight. | Web | As needed | House |  | Ethics |
| [AOC.gov](https://aoc.gov) | Architect of Capitol. Best for: Facilities info. | Web | As needed | AOC |  | Admin / Facilities |
| [VisitTheCapitol.gov](https://visitthecapitol.gov) | Visitor portal. Best for: Tours & info. | Web | As needed | AOC |  | Public / Visitor |
| [Senate XML Resources](https://www.senate.gov/general/XML.htm) | Senate XML. Best for: Data resources. | XML | Various | Senate |  | Tools / Standards |
| [DomeWatch](https://domewatch.us) | House Dem floor info. Best for: Floor schedule & updates. | Web | Daily | Civil Society | Leadership tool | Legislation / Floor |
| [Law Library of Congress](https://www.loc.gov/collections/publications-of-the-law-library-of-congress/about-this-collection/) | Legal reports. Best for: Foreign/comparative law. | PDF/HTML | Rolling | LOC | Specialized foreign law topics | Research / Law |
| [Bioguide](https://bioguide.congress.gov) | Member directory. Best for: Unique IDs & photos. | XML, JSON | As updated | LOC | Crosswalk with Senate LIS needed | Members / IDs |
| [House Telephone Directory](https://directory.house.gov) | House staff telephone directory. Best for: Staff contacts. | XML, JSON | Daily | House | Exportable contact info | Members / Staff |
| [Congressional Data Task Force Innovation Hub](https://usgpo.github.io/innovation/) | Standards hub. Best for: USLM/XML resources. | Web | Ongoing | GPO | Links to XML WG | Tools / Standards |
| [House Statement of Disbursements](https://www.house.gov/the-house-explained/open-government/statement-of-disbursements) | Office expenditures. Best for: House-level spending. | CSV, PDF | Quarterly | House | Recent years are spreadsheets | Admin / Finance |
| [Senate Statement of Official and Personnel Expense Accounts SOPOEA](https://www.senate.gov/legislative/common/generic/report_secsen.htm) | Office expenditures. Best for: Senate-level spending. | PDF | Quarterly | Senate | Stays in PDF | Admin / Finance |
| [Congressional district maps as shapefiles](https://kml.house.gov/) | Maps of congressional district as shapefiles. | KML |  | House |  | Districts |


### Other Non-Legislative

| Source / Tool | Description | Data | Update | Origin | Notes | Tags |
|----|----|----|----|----|----|----|
| [CFR Bulk](https://www.govinfo.gov/bulkdata/CFR) | Code of Fed Regs. Best for: Regulatory text. | XML | Annual | GPO |  | Regulations / CFR |
| [eCFR Bulk](https://www.govinfo.gov/bulkdata/ECFR) | eCFR. Best for: Daily regulatory updates. | XML | Daily | GPO |  | Regulations / eCFR |
| [Federal Register Bulk](https://www.govinfo.gov/bulkdata/FR) | Federal Register. Best for: Rules, notices. | XML | Daily | GPO |  | Regulations / FR |
| [Government Manual](https://www.govinfo.gov/bulkdata/GOVMAN) | Government Manual. Best for: Agency profiles. | XML | As updated | GPO |  | Reference / Agencies |
| [House Manual](https://www.govinfo.gov/bulkdata/HMAN) | House Manual. Best for: Rules & precedents. | XML | Biennial | GPO |  | Reference / House Rules |
| [Privacy Act Issuances](https://www.govinfo.gov/bulkdata/PAI) | Privacy Act notices. Best for: System notices. | XML | As updated | GPO |  | Reference / Privacy Act |
| [Public Papers of Presidents](https://www.govinfo.gov/bulkdata/PPP) | Presidential papers. Best for: Speeches & statements. | XML | As published | GPO |  | Reference / Presidency |

### Senate Nominations

| Source / Tool | Description | Data | Update | Origin | Notes | Tags |
|----|----|----|----|----|----|----|
| [Civilian pending in committee](https://www.senate.gov/legislative/LIS/nominations/NomCivilianPendingCommittee.xml) | Nominations feed. Best for: Civilian pending in committee. | XML | Daily | Senate |  | Nominations / Senate |
| [Privileged nominations](https://www.senate.gov/legislative/LIS/nominations/NomPrivileged.xml) | Nominations feed. Best for: Privileged nominations. | XML | Daily | Senate |  | Nominations / Senate |
| [Civilian confirmed](https://www.senate.gov/legislative/LIS/nominations/NomCivilianConfirmed.xml) | Nominations feed. Best for: Civilian confirmed. | XML | Daily | Senate |  | Nominations / Senate |
| [Civilian pending on calendar](https://www.senate.gov/legislative/LIS/nominations/NomCivilianPendingCalendar.xml) | Nominations feed. Best for: Civilian pending on calendar. | XML | Daily | Senate |  | Nominations / Senate |
| [Military pending in committee](https://www.senate.gov/legislative/LIS/nominations/NomNonCivilianPendingCommittee.xml) | Nominations feed. Best for: Military pending in committee. | XML | Daily | Senate |  | Nominations / Senate |
| [Military confirmed](https://www.senate.gov/legislative/LIS/nominations/NomNonCivilianConfirmed.xml) | Nominations feed. Best for: Military confirmed. | XML | Daily | Senate |  | Nominations / Senate |
| [Military pending on calendar](https://www.senate.gov/legislative/LIS/nominations/NomNonCivilianPendingCalendar.xml) | Nominations feed. Best for: Military pending on calendar. | XML | Daily | Senate |  | Nominations / Senate |
| [Withdrawn nominations](https://www.senate.gov/legislative/LIS/nominations/NomWithdrawn.xml) | Nominations feed. Best for: Withdrawn nominations. | XML | Daily | Senate |  | Nominations / Senate |
| [Failed/returned nominations](https://www.senate.gov/legislative/LIS/nominations/NomFailedOrReturned.xml) | Nominations feed. Best for: Failed/returned nominations. | XML | Daily | Senate |  | Nominations / Senate |


### Non-Public / Internal

| Source / Tool | Description | Data | Update | Origin | Notes | Tags |
|----|----|----|----|----|----|----|
| [Webster]((internal)) | Senate intranet. Best for: Staff operations. |  |  | Senate (Internal) |  | Internal / Staff |
| [Housenet]((internal)) | House intranet. Best for: Staff operations. |  |  | House (Internal) |  | Internal / Staff |
| [MemRec](https://memrec.house.gov) | Member/staff photos. Best for: Official portraits. |  | Daily | House (Internal) | Clerk-managed | Members / Staff |
| [HouseCal](https://calendar.house.gov) | House central calendar including floor and committees. Best for: Scheduling. | JSON | Real-time | House (Internal) | Central calendar feed | Legislation / Calendar |
| [LegiDex](https://legidex.house.gov) | House official online staff directory. Best for: staff roles and issue responsibilities, building email lists. |  | Daily | House (Internal) | CAO-managed | Members / Staff |

## Official - Executive & Agencies

### Other

| Source / Tool | Description | Data | Update | Origin | Notes | Tags |
|----|----|----|----|----|----|----|
| [OMB Budget & Appendix](https://www.whitehouse.gov/omb/budget) | Admin budget proposal. Best for: Proposed bill-like text & toplines. | PDF, data | Annual | OMB | Appendix has detailed tables | Spending / Budget |
| [Congressional Justifications (CBJs)](https://www.usaspending.gov/agency) | Budget justifications. Best for: Program-level requests. | PDF, data | Annual | Agencies | FY24+ Transparency Act requires posting | Spending / Budget |
| [USAspending.gov](https://www.usaspending.gov/) | Award implementation. Best for: Grants & contracts data. | API, data | Rolling | Treasury | Shows execution of enacted spending | Spending / Execution |
| [Oversight.gov](https://oversight.gov) | IG reports hub. Best for: Audits & inspections. | PDF | Rolling | CIGIE | Coverage gaps; older reports missing | Oversight / IG Reports |
| [CISA DotGov data](https://flatgithub.com/cisagov/dotgov-data) | DotGov domains. Best for: Federal IT/security. | CSV | Rolling | CISA | Managed by DHS | Tech / Security |
| [GAO Innovation Lab](https://innovations.gao.gov) | GAO Innovations. Best for: GAO projects. | Web | As needed | GAO |  | Oversight / GAO |
| [Periodicially Listing Updates to Management (PLUM) Reporting](https://www.opm.gov/about-us/open-government/plum-reporting/) | List of senior positions in the executive branch. Best for: tracking filled and empty executive branch positions. | TXT, CSV | Annually | OPM |  | Nominations |
| [Congressional District Shapefiles](https://www.census.gov/geographies/mapping-files/2023/geo/tiger-line-file.html) | Shapefiles from the Census Bureau | TIGER/Line Shapefiles |  | Census |  | District Maps |

## Unofficial / Civil Society

### Legislative

| Source / Tool | Description | Data | Update | Origin | Notes | Tags |
|----|----|----|----|----|----|----|
| [GovTrack.us](https://govtrack.us) | Bill tracker. Best for: Legislative activity. | Web | Rolling | Civic Tech | Analytics + visualizations | Legislation / Tracking |
| [Senate Video Links (The Foundation for Amrerican Innovation)](https://www.senatecommitteehearings.com/transcripts) | Senate video links. Best for: Committee footage archive. | Links | Static | Civil Society | \~20 years of coverage | Media / Video |

### Other

| Source / Tool | Description | Data | Update | Origin | Notes | Tags |
|----|----|----|----|----|----|----|
| [Brookings Vital Stats](https://www.brookings.edu/multi-chapter-report/vital-statistics-on-congress) | Staff stats. Best for: Long-term staffing trends. | Tables | Periodic | Think Tank | Commonly cited; caveats | Staff / Research |
| [CongressionalData.org Guide](https://congressionaldata.org/a-biased-yet-reliable-guide-to-sources-of-information-and-data-about-congress/) | Meta guide. Best for: Orientation to data sources. | Web | Periodic | Civic Tech | Curated overview | Meta / Guide |
| [EveryCRSReport.com](https://www.everycrsreport.com) | CRS mirror + data. Best for: Better search & archive. | PDF + data | Rolling | Civic Tech | More coverage; data extracts | Research / Policy |
| [UnitedStates Project](https://github.com/unitedstates) | Data/tools hub. Best for: IDs, scrapers, metadata. | GitHub | Ongoing | Civic Tech | Maintained by volunteers | Tools / IDs |
| [Statements of Disbursements: 1970-2008](https://guides.bpl.org/Congress/Disbursements) | Document repository. Best for: historic House statements of disbursements. | Boston Public Library | Ongoing |   | Maintained by BPL | Tools / IDs |
| [Statements of Disbursements Parser](https://github.com/propublica/disbursements) | Tool for transforming Statement of Disbursements into data. Best for: transforming House statements of disbursements. | Github | Ongoing |   | Built by ProPublica | Tools / IDs |
| [DC Inbox](https://www.dcinbox.com/) | Member enewsletters. Best for: Member email messages. | Web | Rolling | ProPublica | Useful for messaging analysis | Comms / Messaging |
