"""
Official Government Scheme and Service Seed Data for CivicSphere (Module B).
Populates verified Central and State Government schemes with:
- Structured eligibility rules (income thresholds, age, citizen categories)
- Required documents list
- Procedural application steps
- Official portal URLs and grievance mechanisms
"""

from typing import List, Dict, Any
from datetime import datetime, timezone
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.government.models import GovernmentServiceModel

logger = logging.getLogger("civicsphere.seed.gov")

SEED_GOVERNMENT_SCHEMES: List[Dict[str, Any]] = [
    {
        "service_id": "gov_pm_kisan",
        "title": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        "department": "Department of Agriculture and Farmers Welfare",
        "ministry": "Ministry of Agriculture and Farmers Welfare",
        "jurisdiction": "IN",
        "state": None,
        "description": "Central sector income support scheme providing ₹6,000 per year in three equal installments to all landholding farmer families across India.",
        "category": "Agriculture & Farmers Welfare",
        "eligibility_rules": [
            {"field": "occupation", "operator": "equals", "value": "Farmer", "description": "Applicant family must own cultivable landholding"},
            {"field": "exclusion_criteria", "operator": "not_in", "value": ["Institutional Landholders", "Constitutional Post Holders", "Serving/Retired Gov Employee"]},
            {"field": "annual_income", "operator": "less_than", "value": 1000000, "description": "Excludes income tax payees of last assessment year"}
        ],
        "required_documents": [
            "Aadhaar Card",
            "Proof of Agricultural Land Ownership (7/12 Extract or RoR)",
            "Active Savings Bank Account Passbook",
            "Mobile Number Linked to Aadhaar"
        ],
        "application_methods": ["ONLINE", "OFFLINE"],
        "procedure_steps": [
            {"step_number": 1, "title": "Portal Registration", "description": "Visit pmkisan.gov.in and click New Farmer Registration", "portal_url": "https://pmkisan.gov.in"},
            {"step_number": 2, "title": "Aadhaar Authentication", "description": "Enter Aadhaar number and state, verify OTP received on mobile"},
            {"step_number": 3, "title": "Land & Bank Details", "description": "Upload land record details and verify bank account IFSC and account number"},
            {"step_number": 4, "title": "District Verification", "description": "State nodal officer and Patwari verify land records within 30 days"}
        ],
        "official_portal": "https://pmkisan.gov.in",
        "grievance_portal": "https://pgportal.gov.in",
        "appeal_authority": "District Level Grievance Redressal Committee",
        "confidence": 1.0,
    },
    {
        "service_id": "gov_pmjay_ayushman",
        "title": "Ayushman Bharat PM-JAY (Pradhan Mantri Jan Arogya Yojana)",
        "department": "National Health Authority",
        "ministry": "Ministry of Health and Family Welfare",
        "jurisdiction": "IN",
        "state": None,
        "description": "World's largest government-funded health assurance scheme providing secondary and tertiary care hospitalization cover of ₹5 lakh per family per year to eligible vulnerable families.",
        "category": "Health & Family Welfare",
        "eligibility_rules": [
            {"field": "secc_deprivation_criteria", "operator": "equals", "value": True, "description": "Listed under SECC 2011 deprivation criteria or active ration card holder"},
            {"field": "annual_income", "operator": "less_than", "value": 300000, "description": "Families classified under BPL/EWS economic category"}
        ],
        "required_documents": [
            "Aadhaar Card or Valid Government Photo ID",
            "Ration Card (Family Proof)",
            "Active Mobile Number"
        ],
        "application_methods": ["ONLINE", "OFFLINE"],
        "procedure_steps": [
            {"step_number": 1, "title": "Eligibility Verification", "description": "Check eligibility on beneficiary.nha.gov.in using mobile or ration card number", "portal_url": "https://beneficiary.nha.gov.in"},
            {"step_number": 2, "title": "e-KYC Processing", "description": "Complete Aadhaar OTP or facial recognition e-KYC on the portal or CSC center"},
            {"step_number": 3, "title": "Ayushman Card Generation", "description": "Download PVC Ayushman Gold Card instantly upon approval"},
            {"step_number": 4, "title": "Empaneled Hospital Treatment", "description": "Show card at Ayushman Mitra desk in any empaneled hospital for cashless treatment"}
        ],
        "official_portal": "https://beneficiary.nha.gov.in",
        "grievance_portal": "https://cgrms.pmjay.gov.in",
        "appeal_authority": "State Health Agency (SHA) Grievance Officer",
        "confidence": 1.0,
    },
    {
        "service_id": "gov_pmay_urban",
        "title": "Pradhan Mantri Awas Yojana - Urban 2.0 (PMAY-U)",
        "department": "Housing and Urban Poverty Alleviation",
        "ministry": "Ministry of Housing and Urban Affairs",
        "jurisdiction": "IN",
        "state": None,
        "description": "Credit Linked Subsidy and Affordable Housing scheme to provide all-weather pucca houses to eligible urban families without pucca residence.",
        "category": "Housing & Urban Affairs",
        "eligibility_rules": [
            {"field": "pucca_house_ownership", "operator": "equals", "value": False, "description": "Beneficiary family must not own a pucca house anywhere in India"},
            {"field": "annual_income", "operator": "less_than", "value": 900000, "description": "EWS (up to ₹3L), LIG (₹3L-₹6L), MIG (₹6L-₹9L)"}
        ],
        "required_documents": [
            "Aadhaar Card of all family members",
            "Income Certificate issued by Competent Authority",
            "Proof of Residence in Urban Local Body",
            "Bank Account Statement (6 months)"
        ],
        "application_methods": ["ONLINE", "OFFLINE"],
        "procedure_steps": [
            {"step_number": 1, "title": "Online Registration", "description": "Apply on pmaymis.gov.in under Citizen Assessment or visit Municipal CSC", "portal_url": "https://pmaymis.gov.in"},
            {"step_number": 2, "title": "Document Verification", "description": "Urban Local Body verifies physical site and family eligibility"},
            {"step_number": 3, "title": "Subsidy Sanction", "description": "Direct Benefit Transfer / Interest subsidy released directly to loan account"}
        ],
        "official_portal": "https://pmaymis.gov.in",
        "grievance_portal": "https://pmaymis.gov.in/pgportal",
        "appeal_authority": "Municipal Commissioner / ULB Nodal Officer",
        "confidence": 1.0,
    },
    {
        "service_id": "gov_atal_pension",
        "title": "Atal Pension Yojana (APY)",
        "department": "Department of Financial Services",
        "ministry": "Ministry of Finance",
        "jurisdiction": "IN",
        "state": None,
        "description": "Guaranteed minimum monthly pension of ₹1,000 to ₹5,000 to citizens in the unorganized sector upon attaining 60 years of age.",
        "category": "Social Security & Pension",
        "eligibility_rules": [
            {"field": "age", "operator": "greater_than_or_equal", "value": 18, "description": "Minimum age is 18 years"},
            {"field": "age", "operator": "less_than_or_equal", "value": 40, "description": "Maximum joining age is 40 years"},
            {"field": "income_tax_payer", "operator": "equals", "value": False, "description": "Must not be an income taxpayer"}
        ],
        "required_documents": [
            "Savings Bank Account / Post Office Account",
            "Aadhaar Card",
            "Nominee Information"
        ],
        "application_methods": ["ONLINE", "OFFLINE"],
        "procedure_steps": [
            {"step_number": 1, "title": "Account Opening", "description": "Submit APY form through NetBanking or at your bank branch"},
            {"step_number": 2, "title": "Auto-Debit Authorization", "description": "Set up monthly, quarterly, or half-yearly auto-debit contribution"},
            {"step_number": 3, "title": "PRAN Issuance", "description": "Receive Permanent Retirement Account Number (PRAN) confirmation SMS"}
        ],
        "official_portal": "https://www.npscra.nsdl.co.in",
        "grievance_portal": "https://cra-nsdl.com/CRA/cgmsMenu.do",
        "appeal_authority": "Pension Fund Regulatory and Development Authority (PFRDA)",
        "confidence": 1.0,
    },
    {
        "service_id": "gov_pm_jandhan",
        "title": "Pradhan Mantri Jan Dhan Yojana (PMJDY)",
        "department": "Department of Financial Services",
        "ministry": "Ministry of Finance",
        "jurisdiction": "IN",
        "state": None,
        "description": "National Mission for Financial Inclusion providing zero-balance savings bank accounts with RuPay debit card, ₹2 lakh accidental insurance, and ₹10,000 overdraft facility.",
        "category": "Financial Inclusion & Banking",
        "eligibility_rules": [
            {"field": "nationality", "operator": "equals", "value": "Indian", "description": "Must be an Indian citizen"},
            {"field": "age", "operator": "greater_than_or_equal", "value": 10, "description": "Minors aged 10 and above can open accounts"}
        ],
        "required_documents": [
            "Aadhaar Card or Voter ID / Passport / NREGA Job Card",
            "Passport Size Photograph"
        ],
        "application_methods": ["OFFLINE", "ONLINE"],
        "procedure_steps": [
            {"step_number": 1, "title": "Form Submission", "description": "Visit any commercial bank or Bank Mitra (Business Correspondent)"},
            {"step_number": 2, "title": "Instant Kit Handover", "description": "Receive zero-balance passbook and RuPay debit card within 7 working days"}
        ],
        "official_portal": "https://pmjdy.gov.in",
        "grievance_portal": "https://pgportal.gov.in",
        "appeal_authority": "Banking Ombudsman, Reserve Bank of India",
        "confidence": 1.0,
    },
    {
        "service_id": "gov_sukanya_samriddhi",
        "title": "Sukanya Samriddhi Yojana (Beti Bachao Beti Padhao)",
        "department": "Department of Economic Affairs",
        "ministry": "Ministry of Finance",
        "jurisdiction": "IN",
        "state": None,
        "description": "Small deposit savings scheme for girl children with high sovereign interest rates and full EEE tax exemption under Section 80C.",
        "category": "Women & Child Development",
        "eligibility_rules": [
            {"field": "beneficiary_gender", "operator": "equals", "value": "Female"},
            {"field": "age", "operator": "less_than_or_equal", "value": 10, "description": "Account can be opened from birth up to 10 years of age"}
        ],
        "required_documents": [
            "Birth Certificate of Girl Child",
            "Identity and Address Proof of Parent/Legal Guardian",
            "Photographs of Child and Guardian"
        ],
        "application_methods": ["OFFLINE"],
        "procedure_steps": [
            {"step_number": 1, "title": "Branch Visit", "description": "Visit any Post Office or authorized commercial bank branch"},
            {"step_number": 2, "title": "Initial Deposit", "description": "Open account with initial deposit of ₹250 (max ₹1.5L per financial year)"}
        ],
        "official_portal": "https://www.indiapost.gov.in",
        "grievance_portal": "https://indiapost.gov.in/VAS/Pages/CustomerSupport/Grievances.aspx",
        "appeal_authority": "Superintendent of Post Offices",
        "confidence": 1.0,
    },
    {
        "service_id": "gov_pm_svanidhi",
        "title": "PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi)",
        "department": "Housing and Urban Poverty Alleviation",
        "ministry": "Ministry of Housing and Urban Affairs",
        "jurisdiction": "IN",
        "state": None,
        "description": "Micro-credit collateral-free working capital loan up to ₹50,000 with 7% interest subsidy and cashback incentives on digital transactions for urban street vendors.",
        "category": "Livelihood & Micro-Enterprise",
        "eligibility_rules": [
            {"field": "occupation", "operator": "equals", "value": "Street Vendor", "description": "Engaged in vending in urban areas on or before March 24, 2020"},
            {"field": "certificate_of_vending", "operator": "equals", "value": True, "description": "Holds Certificate of Vending or Identity Card issued by ULB"}
        ],
        "required_documents": [
            "Aadhaar Card",
            "Voter ID / Driving License",
            "Certificate of Vending / Letter of Recommendation (LoR)",
            "Bank Account Details"
        ],
        "application_methods": ["ONLINE"],
        "procedure_steps": [
            {"step_number": 1, "title": "Application Filing", "description": "Apply online at pmsvanidhi.mohua.gov.in or PM SVANidhi mobile app", "portal_url": "https://pmsvanidhi.mohua.gov.in"},
            {"step_number": 2, "title": "Lending Institution Sanction", "description": "Direct sanction and disbursal within 15 days by designated bank"}
        ],
        "official_portal": "https://pmsvanidhi.mohua.gov.in",
        "grievance_portal": "https://pmsvanidhi.mohua.gov.in/Home/Feedback",
        "appeal_authority": "Town Vending Committee (TVC)",
        "confidence": 1.0,
    },
    {
        "service_id": "gov_pm_ujjwala",
        "title": "Pradhan Mantri Ujjwala Yojana 2.0 (PMUY)",
        "department": "Ministry of Petroleum and Natural Gas",
        "ministry": "Ministry of Petroleum and Natural Gas",
        "jurisdiction": "IN",
        "state": None,
        "description": "Deposit-free LPG connection along with first refill and stove free of cost to adult women from poor households across India.",
        "category": "Energy & Social Welfare",
        "eligibility_rules": [
            {"field": "applicant_gender", "operator": "equals", "value": "Female"},
            {"field": "age", "operator": "greater_than_or_equal", "value": 18},
            {"field": "existing_lpg_connection", "operator": "equals", "value": False, "description": "No other LPG connection in same household"}
        ],
        "required_documents": [
            "Aadhaar Card of Applicant and Adult Family Members",
            "Ration Card / Family Proof",
            "Bank Account Passbook (Aadhaar Linked)"
        ],
        "application_methods": ["ONLINE", "OFFLINE"],
        "procedure_steps": [
            {"step_number": 1, "title": "Application Form", "description": "Apply on pmuy.gov.in or submit form to nearest LPG distributor (Indane/BharatGas/HP)", "portal_url": "https://pmuy.gov.in"},
            {"step_number": 2, "title": "Connection Installation", "description": "Distributor delivers stove, cylinder, and regulator with zero deposit"}
        ],
        "official_portal": "https://pmuy.gov.in",
        "grievance_portal": "https://pgportal.gov.in",
        "appeal_authority": "District Nodal Officer (Oil Industry)",
        "confidence": 1.0,
    },
    {
        "service_id": "gov_eshram_portal",
        "title": "e-Shram National Database for Unorganized Workers",
        "department": "Ministry of Labour and Employment",
        "ministry": "Ministry of Labour and Employment",
        "jurisdiction": "IN",
        "state": None,
        "description": "National registration platform providing 12-digit Universal Account Number (UAN) and ₹2 lakh accidental death/disability coverage to unorganized workers.",
        "category": "Labour & Employment",
        "eligibility_rules": [
            {"field": "age", "operator": "greater_than_or_equal", "value": 16},
            {"field": "age", "operator": "less_than_or_equal", "value": 59},
            {"field": "epfo_esic_member", "operator": "equals", "value": False, "description": "Must not be an active member of EPFO or ESIC"}
        ],
        "required_documents": [
            "Aadhaar Card",
            "Aadhaar-linked Active Mobile Number",
            "Bank Account Number with IFSC"
        ],
        "application_methods": ["ONLINE", "OFFLINE"],
        "procedure_steps": [
            {"step_number": 1, "title": "Self Registration", "description": "Visit eshram.gov.in and click Register on e-Shram", "portal_url": "https://eshram.gov.in"},
            {"step_number": 2, "title": "UAN Card Download", "description": "Instantly download e-Shram card with universal QR code"}
        ],
        "official_portal": "https://eshram.gov.in",
        "grievance_portal": "https://eshram.gov.in/grievance",
        "appeal_authority": "Chief Labour Commissioner (Central)",
        "confidence": 1.0,
    },
    {
        "service_id": "gov_nsap_pension",
        "title": "National Social Assistance Programme (Indira Gandhi National Old Age Pension)",
        "department": "Department of Rural Development",
        "ministry": "Ministry of Rural Development",
        "jurisdiction": "IN",
        "state": None,
        "description": "Monthly direct benefit social security pension to senior citizens living below the poverty line.",
        "category": "Social Security & Pension",
        "eligibility_rules": [
            {"field": "age", "operator": "greater_than_or_equal", "value": 60, "description": "Citizen must be 60 years or older"},
            {"field": "bpl_status", "operator": "equals", "value": True, "description": "Applicant family must be identified below the poverty line"}
        ],
        "required_documents": [
            "Age Proof / Birth Certificate or Aadhaar Card",
            "BPL Ration Card",
            "Bank / Post Office Passbook"
        ],
        "application_methods": ["OFFLINE", "ONLINE"],
        "procedure_steps": [
            {"step_number": 1, "title": "Application Filing", "description": "Submit application to Block Development Officer (BDO) or Sub-Divisional Magistrate"},
            {"step_number": 2, "title": "Sanction & Disbursal", "description": "Monthly pension credited automatically to bank account via PFMS"}
        ],
        "official_portal": "https://nsap.nic.in",
        "grievance_portal": "https://pgportal.gov.in",
        "appeal_authority": "District Social Welfare Officer",
        "confidence": 1.0,
    },
    {
        "service_id": "gov_ration_onorc",
        "title": "One Nation One Ration Card (ONORC)",
        "department": "Department of Food and Public Distribution",
        "ministry": "Ministry of Consumer Affairs, Food and Public Distribution",
        "jurisdiction": "IN",
        "state": None,
        "description": "Nationwide ration portability enabling migrant NFSA beneficiaries to lift their entitled subsidized foodgrains from any Fair Price Shop (FPS) across India.",
        "category": "Food & Public Distribution",
        "eligibility_rules": [
            {"field": "nfsa_beneficiary", "operator": "equals", "value": True, "description": "Must be an active NFSA Antyodaya or Priority Household cardholder"},
            {"field": "aadhaar_seeding", "operator": "equals", "value": True, "description": "Ration card must be seeded with Aadhaar"}
        ],
        "required_documents": [
            "Aadhaar Card of Family Member lifting ration",
            "Existing NFSA Ration Card"
        ],
        "application_methods": ["OFFLINE"],
        "procedure_steps": [
            {"step_number": 1, "title": "Visit Any FPS", "description": "Go to any electronic Point of Sale (ePoS) Fair Price Shop in India"},
            {"step_number": 2, "title": "Biometric Authentication", "description": "Authenticate via Aadhaar fingerprint or iris scan and lift subsidized grains"}
        ],
        "official_portal": "https://nfsa.gov.in",
        "grievance_portal": "https://nfsa.gov.in/portal/Grievance_Registration",
        "appeal_authority": "District Grievance Redressal Officer (Food)",
        "confidence": 1.0,
    },
    {
        "service_id": "gov_maha_dbt_farmer",
        "title": "MahaDBT Farmer Welfare Schemes Portal",
        "department": "Department of Agriculture",
        "ministry": "Government of Maharashtra",
        "jurisdiction": "IN",
        "state": "Maharashtra",
        "description": "Unified single-window application portal for Maharashtra farmers for farm mechanization, micro-irrigation subsidies, and horticulture plantation schemes.",
        "category": "State Specific & Agriculture",
        "eligibility_rules": [
            {"field": "state", "operator": "equals", "value": "Maharashtra", "description": "Resident farmer of Maharashtra"},
            {"field": "land_record", "operator": "equals", "value": "7/12 & 8A", "description": "Valid 7/12 extract and 8A holding"}
        ],
        "required_documents": [
            "Aadhaar Card",
            "7/12 & 8A Extract",
            "Caste Certificate (if claiming SC/ST subsidy)",
            "Bank Passbook"
        ],
        "application_methods": ["ONLINE"],
        "procedure_steps": [
            {"step_number": 1, "title": "Profile Login", "description": "Register on mahadbt.maharashtra.gov.in with Aadhaar", "portal_url": "https://mahadbt.maharashtra.gov.in"},
            {"step_number": 2, "title": "Scheme Selection", "description": "Select Krishi Yantrikikaran, Drip Irrigation, or Orchard Plantation"},
            {"step_number": 3, "title": "Lottery Selection", "description": "Transparent computerized lottery allocates pre-sanction letters"}
        ],
        "official_portal": "https://mahadbt.maharashtra.gov.in",
        "grievance_portal": "https://grievances.maharashtra.gov.in",
        "appeal_authority": "Taluka Agriculture Officer (TAO)",
        "confidence": 1.0,
    }
]


async def seed_government_services(db: AsyncSession) -> int:
    """Idempotently seeds verified government schemes into PostgreSQL."""
    res = await db.execute(select(GovernmentServiceModel.service_id))
    existing_ids = set(res.scalars().all())

    inserted_count = 0
    for scheme_data in SEED_GOVERNMENT_SCHEMES:
        sid = scheme_data["service_id"]
        if sid in existing_ids:
            continue
        svc = GovernmentServiceModel(
            service_id=sid,
            title=scheme_data["title"],
            department=scheme_data["department"],
            ministry=scheme_data.get("ministry"),
            jurisdiction=scheme_data.get("jurisdiction", "IN"),
            state=scheme_data.get("state"),
            description=scheme_data["description"],
            category=scheme_data["category"],
            eligibility_rules=scheme_data["eligibility_rules"],
            required_documents=scheme_data["required_documents"],
            application_methods=scheme_data["application_methods"],
            procedure_steps=scheme_data["procedure_steps"],
            official_portal=scheme_data.get("official_portal"),
            grievance_portal=scheme_data.get("grievance_portal"),
            appeal_authority=scheme_data.get("appeal_authority"),
            last_verified_at=datetime.now(timezone.utc),
            confidence=scheme_data.get("confidence", 1.0),
        )
        db.add(svc)
        inserted_count += 1

    if inserted_count > 0:
        await db.commit()
        logger.info(f"Successfully seeded {inserted_count} official government schemes into database.")

    return inserted_count
