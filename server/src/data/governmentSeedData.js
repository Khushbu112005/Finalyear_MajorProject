const d=new Date("2026-08-29T00:00:00Z");
const source=(sourceId,title,url,sourceType,jurisdiction,organization,state)=>({sourceId,title,publisher:organization,organization,url,officialUrl:url,sourceType,jurisdiction,...(state?{state}:{}),retrievedAt:d,version:"1.0",verified:true,lastVerified:d,verificationStatus:"ACTIVE",verificationNotes:"Official portal reviewed for seed registry."});
const sources=[source("src-pmkisan-official","PM-KISAN","https://pmkisan.gov.in/","MINISTRY_PORTAL","central","Department of Agriculture & Farmers Welfare"),source("src-nrega-legislation","Mahatma Gandhi NREGA","https://nrega.nic.in/","LEGISLATION","central","Ministry of Rural Development"),source("src-scholarships","National Scholarship Portal","https://scholarships.gov.in/","MINISTRY_PORTAL","central","Ministry of Education"),source("src-mahaswayam","MahaSwayam","https://www.mahaswayam.gov.in/","STATE_PORTAL","state","Government of Maharashtra","Maharashtra"),source("src-ssp-karnataka","Karnataka State Scholarship Portal","https://ssp.postmatric.karnataka.gov.in/","STATE_PORTAL","state","Government of Karnataka","Karnataka"),source("src-pmjay","PM-JAY","https://nha.gov.in/PM-JAY","AUTHORITY_NOTIF","central","National Health Authority"),source("src-uidai","UIDAI","https://uidai.gov.in/","AUTHORITY_NOTIF","central","UIDAI"),source("src-pmay","PMAY-Urban","https://pmay-urban.gov.in/","MINISTRY_PORTAL","central","Ministry of Housing and Urban Affairs"),source("src-wcd","Ministry of Women and Child Development","https://wcd.gov.in/","MINISTRY_PORTAL","central","Ministry of Women and Child Development"),source("src-nsap","NSAP","https://nsap.nic.in/","MINISTRY_PORTAL","central","Ministry of Rural Development"),source("src-udid","UDID","https://www.swavlambancard.gov.in/","MINISTRY_PORTAL","central","Department of Empowerment of Persons with Disabilities"),source("src-delhi","Delhi e-District","https://edistrict.delhigovt.nic.in/","STATE_PORTAL","state","Government of NCT of Delhi","Delhi")];
const make=(serviceId,serviceName,category,sourceId,extra={})=>{const x=sources.find(q=>q.sourceId===sourceId);return{serviceId,serviceName,serviceType:"Government Service",description:`${serviceName}; consult official portal for current terms.`,department:x.organization,ministry:x.organization,authority:x.organization,jurisdiction:x.jurisdiction,...(x.state?{state:x.state}:{}),categories:[category],keywords:[category.toLowerCase(),...serviceName.toLowerCase().split(/[^a-z0-9]+/).filter(q=>q.length>3)],targetBeneficiaries:["Eligible residents"],eligibilityRules:[],requiredDocuments:[{documentId:`${serviceId}-docs`,documentName:"Documents listed by authority",required:false,isMandatory:false,sourceId}],procedureSteps:[{stepNumber:1,title:"Review official portal",description:"Read current instructions.",sourceId},{stepNumber:2,title:"Use official application channel",description:"Apply through official channel.",sourceId}],applicationMethods:["Official portal"],officialPortal:{title:x.title,url:x.url,verified:true},officialSources:[sourceId],fees:"Check official portal",deadlines:"Check official portal",processingTime:"Check official portal",lastVerified:d,sourceVersion:"1.0",verificationStatus:"ACTIVE",confidence:.9,...extra}};
const services = [
    make("central-pm-kisan", "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)", "Agriculture", "src-pmkisan-official", {
        description: "Central sector scheme by the Department of Agriculture & Farmers Welfare providing financial benefit of Rs. 6,000 per year in three equal installments of Rs. 2,000 directly to eligible landholding farmer families.",
        keywords: ["farmer", "agriculture", "kisan", "crop", "landholding", "pmkisan", "dbt", "ekyc"],
        eligibilityRules: [
            { field: "occupation", operator: "equals", value: "Farmer" },
            { field: "employmentStatus", operator: "equals", value: "Farmer" },
            { field: "annualIncome", operator: "less_than_or_equal", value: 300000 }
        ],
        requiredDocuments: [
            { documentId: "doc-aadhaar", documentName: "Aadhaar Card", name: "Aadhaar Card", required: true, isMandatory: true, sourceId: "src-pmkisan-official" },
            { documentId: "doc-landhold", documentName: "Landholding Certificate", name: "Landholding Certificate", required: true, isMandatory: true, sourceId: "src-pmkisan-official" },
            { documentId: "doc-bankbook", documentName: "Bank Account Proof", name: "Bank Account Proof", required: true, isMandatory: true, sourceId: "src-pmkisan-official" }
        ],
        procedureSteps: [
            { stepNumber: 1, title: "Farmers Corner Registration", description: "Access pmkisan.gov.in, navigate to 'Farmers Corner', and select 'New Farmer Registration'.", sourceId: "src-pmkisan-official" },
            { stepNumber: 2, title: "Enter Aadhaar & Mobile Details", description: "Provide Aadhaar number, mobile number, state, district, and complete OTP verification.", sourceId: "src-pmkisan-official" },
            { stepNumber: 3, title: "Fill Landholding Particulars", description: "Enter personal details, land record/khasra survey numbers, ownership area, and Aadhaar-seeded bank account details.", sourceId: "src-pmkisan-official" },
            { stepNumber: 4, title: "Complete Mandatory e-KYC", description: "Complete e-KYC online via Aadhaar OTP on PM-KISAN portal or biometric authentication at a Common Service Centre (CSC).", sourceId: "src-pmkisan-official" },
            { stepNumber: 5, title: "Nodal Officer Verification", description: "Application and land ownership records are verified online by State/District Nodal Officer.", sourceId: "src-pmkisan-official" },
            { stepNumber: 6, title: "Direct Benefit Transfer (DBT)", description: "Post-approval, installment of Rs. 2,000 is directly credited into farmer's bank account via Aadhaar Payment Bridge.", sourceId: "src-pmkisan-official" }
        ],
        applicationMethods: ["Online (PM-KISAN Portal - pmkisan.gov.in)", "PM-KISAN Mobile App", "Common Service Centre (CSC)", "Local Agriculture Office / Revenue Department"],
        fees: "Free of cost",
        deadlines: "None (Continuous scheme; enrollment and e-KYC remain open throughout the year)",
        processingTime: "Installment release per 4-month cycle following State/District verification",
        grievanceRoute: {
            authority: "Department of Agriculture & Farmers Welfare / PM-KISAN Help Desk",
            description: "File grievances regarding pending installments, Aadhaar seeding issues, e-KYC failure, or land verification status.",
            url: "https://pmkisan.gov.in/",
            portal: "PM-KISAN Help Desk / Grievance Redressal Portal",
            contact: "PM-KISAN Helpline: 155261 | 1800-11-5526 | Landline: 011-23381092 | Email: pmkisan-ict@gov.in"
        }
    }),
    make("central-mgnrega", "Mahatma Gandhi National Rural Employment Guarantee Scheme", "Employment", "src-nrega-legislation", {
        eligibilityRules: [
            { field: "age", operator: "greater_than_or_equal", value: 18, description: "Age must be 18 years or older." }
        ],
        requiredDocuments: [
            { documentId: "doc-aadhaar", documentName: "Aadhaar Card", name: "Aadhaar Card", required: true, isMandatory: true, sourceId: "src-nrega-legislation", description: "Identity and address proof." },
            { documentId: "doc-bankbook", documentName: "Bank/Post Office Account Details", name: "Bank/Post Office Account Details", required: true, isMandatory: true, sourceId: "src-nrega-legislation", description: "Active bank or post office account details for direct wage credit." },
            { documentId: "doc-photo", documentName: "Passport-sized Photograph", name: "Passport-sized Photograph", required: true, isMandatory: true, sourceId: "src-nrega-legislation", description: "Recent photograph of the applicant." },
            { documentId: "doc-voterid", documentName: "Voter ID Card", name: "Voter ID Card", required: false, isMandatory: false, sourceId: "src-nrega-legislation", description: "Optional alternative identity or address proof." }
        ],
        procedureSteps: [
            { stepNumber: 1, title: "Visit Gram Panchayat", description: "Visit the local Gram Panchayat office in your rural area.", sourceId: "src-nrega-legislation" },
            { stepNumber: 2, title: "Submit Registration Application", description: "Submit a written application or oral request for registration with passport-sized photographs, Aadhaar, and bank details.", sourceId: "src-nrega-legislation" },
            { stepNumber: 3, title: "Receive Job Card", description: "Get your Job Card issued by the Gram Panchayat within 15 days of registration after verification.", sourceId: "src-nrega-legislation" },
            { stepNumber: 4, title: "Submit Work Demand", description: "Submit a written request for employment to the Gram Panchayat. A receipt of the request must be issued.", sourceId: "src-nrega-legislation" },
            { stepNumber: 5, title: "Allocation of Work", description: "Gram Panchayat will provide unskilled manual work within 15 days of submitting the work demand.", sourceId: "src-nrega-legislation" }
        ],
        applicationMethods: ["Offline (Gram Panchayat Office)"],
        fees: "Free of cost",
        deadlines: "None (Open throughout the year)",
        processingTime: "15 days for Job Card issuance",
        grievanceRoute: {
            authority: "Ministry of Rural Development / State Grievance Redressal Officer",
            description: "File complaints regarding delayed payments, non-allocation of work, or Job Card errors.",
            url: "https://pgportal.gov.in",
            portal: "Centralized Public Grievance Redress and Monitoring System (CPGRAMS)",
            contact: "Toll-Free Helpline: 1800-111-555"
        }
    }),
    make("central-nsp", "National Scholarship Portal", "Education", "src-scholarships", {
        keywords: ["scholarship", "education", "student", "matric", "tuition", "nsp"],
        eligibilityRules: [
            { field: "studentStatus", operator: "equals", value: true, description: "Applicant must be an actively enrolled student." },
            { field: "annualIncome", operator: "less_than_or_equal", value: 250000, description: "Family annual income limit for scholarship eligibility." }
        ],
        requiredDocuments: [
            { documentId: "doc-aadhaar", documentName: "Aadhaar Card", name: "Aadhaar Card", required: true, isMandatory: true, sourceId: "src-scholarships", description: "Identity and Aadhaar number verification." },
            { documentId: "doc-incomecert", documentName: "Family Income Certificate", name: "Family Income Certificate", required: true, isMandatory: true, sourceId: "src-scholarships", description: "Proof of family annual income." },
            { documentId: "doc-marksheet", documentName: "Previous Academic Marksheet", name: "Previous Academic Marksheet", required: true, isMandatory: true, sourceId: "src-scholarships", description: "Marksheet of the qualifying examination." },
            { documentId: "doc-studentproof", documentName: "Bonafide Student Certificate / Fee Receipt", name: "Bonafide Student Certificate / Fee Receipt", required: true, isMandatory: true, sourceId: "src-scholarships", description: "Proof of active enrolment in a recognized institution." },
            { documentId: "doc-bankbook", documentName: "Bank Account Passbook", name: "Bank Account Passbook", required: true, isMandatory: true, sourceId: "src-scholarships", description: "Aadhaar-seeded bank account for Direct Benefit Transfer (DBT)." },
            { documentId: "doc-castecert", documentName: "Caste Certificate", name: "Caste Certificate", required: false, isMandatory: false, sourceId: "src-scholarships", description: "Required for SC/ST/OBC category-specific schemes." }
        ],
        procedureSteps: [
            { stepNumber: 1, title: "Register on NSP 2.0 Portal", description: "Visit scholarships.gov.in and complete One Time Registration (OTR) using Aadhaar.", sourceId: "src-scholarships" },
            { stepNumber: 2, title: "Fill Online Application", description: "Log in with OTR credentials and fill out student personal, academic, and scheme details.", sourceId: "src-scholarships" },
            { stepNumber: 3, title: "Upload Scanned Documents", description: "Upload mandatory documents including income proof, marksheet, bonafide student certificate, and bank details.", sourceId: "src-scholarships" },
            { stepNumber: 4, title: "Institute Verification", description: "Submit application online; Institute Nodal Officer (INO) verifies student details.", sourceId: "src-scholarships" },
            { stepNumber: 5, title: "District/State Verification", description: "Application is validated by District Nodal Officer (DNO) / State Nodal Officer (SNO).", sourceId: "src-scholarships" },
            { stepNumber: 6, title: "DBT Disbursement", description: "Scholarship amount is directly credited to the beneficiary student's bank account via Aadhaar Payment Bridge.", sourceId: "src-scholarships" }
        ],
        applicationMethods: ["Online (National Scholarship Portal - NSP 2.0)", "NSP Mobile App"],
        fees: "Free of cost",
        deadlines: "Annually notified per academic session",
        processingTime: "2 to 4 months following institutional verification and DBT approval",
        grievanceRoute: {
            authority: "Ministry of Education / National Scholarship Division",
            description: "File grievances regarding OTR generation, institute verification delays, or scholarship payment failure.",
            url: "https://scholarships.gov.in",
            portal: "NSP Grievance Redressal Portal / CPGRAMS",
            contact: "Helpdesk Phone: 0120-6619540 | Email: helpdesk@nsp.gov.in"
        }
    }),
    make("state-maha-employment", "MahaSwayam Employment Services", "Employment", "src-mahaswayam", {
        keywords: ["employment", "job", "mahaswayam", "maharashtra", "unemployed", "skill", "rozgar"],
        eligibilityRules: [
            { field: "state", operator: "equals", value: "Maharashtra", description: "Must reside in Maharashtra." },
            { field: "employmentStatus", operator: "equals", value: "Unemployed", description: "Applicant must be an active job seeker / unemployed." }
        ],
        requiredDocuments: [
            { documentId: "doc-aadhaar", documentName: "Aadhaar Card", name: "Aadhaar Card", required: true, isMandatory: true, sourceId: "src-mahaswayam", description: "Identity and address proof." },
            { documentId: "doc-domicile", documentName: "Domicile Certificate of Maharashtra", name: "Domicile Certificate of Maharashtra", required: true, isMandatory: true, sourceId: "src-mahaswayam", description: "Proof of residence in Maharashtra." },
            { documentId: "doc-educational", documentName: "Educational Marksheets / Certificates", name: "Educational Marksheets / Certificates", required: true, isMandatory: true, sourceId: "src-mahaswayam", description: "Educational qualifications proof (10th/12th/Diploma/Degree)." },
            { documentId: "doc-photo", documentName: "Passport-sized Photograph", name: "Passport-sized Photograph", required: true, isMandatory: true, sourceId: "src-mahaswayam", description: "Recent passport photo." }
        ],
        procedureSteps: [
            { stepNumber: 1, title: "Access MahaSwayam Portal", description: "Visit mahaswayam.gov.in and navigate to the Employment (Rozgar) section.", sourceId: "src-mahaswayam" },
            { stepNumber: 2, title: "Job Seeker Registration", description: "Register using Mobile Number, Email ID, and Aadhaar Card.", sourceId: "src-mahaswayam" },
            { stepNumber: 3, title: "Fill Educational & Skill Profile", description: "Enter personal details, educational qualifications, skill certifications, and preferred work location.", sourceId: "src-mahaswayam" },
            { stepNumber: 4, title: "Upload Documents", description: "Upload scanned copy of photograph, Aadhaar card, and educational certificates.", sourceId: "src-mahaswayam" },
            { stepNumber: 5, title: "Generate Registration Card", description: "Download and print the MahaSwayam Job Seeker Registration Card.", sourceId: "src-mahaswayam" },
            { stepNumber: 6, title: "Apply for Jobs & Fairs", description: "Apply online for job vacancies, job fairs (Rojgar Melas), and free skill development programs.", sourceId: "src-mahaswayam" }
        ],
        applicationMethods: ["Online (MahaSwayam Portal)", "District Employment & Entrepreneurship Guidance Centre"],
        fees: "Free of cost",
        deadlines: "None (Open throughout the year; registration renewal recommended every 3 years)",
        processingTime: "Instant online registration card generation",
        grievanceRoute: {
            authority: "Skill Development, Employment and Entrepreneurship Department, Govt of Maharashtra",
            description: "Grievance redressal for MahaSwayam portal login issues, registration renewal, or job fair queries.",
            url: "https://www.mahaswayam.gov.in",
            portal: "MahaSwayam Citizen Grievance Portal / Aaple Sarkar Grievance",
            contact: "Helpline Phone: 022-22625651 | Email: support@mahaswayam.gov.in"
        }
    }),
    make("state-kar-scholarship", "Karnataka Post-Matric Scholarship Portal Service", "Education", "src-ssp-karnataka", {
        description: "State-level unified post-matric scholarship portal operated by the Government of Karnataka for SC, ST, OBC, Minority, and General category students pursuing post-matriculation higher education.",
        keywords: ["scholarship", "karnataka", "ssp", "education", "postmatric", "student", "tuition", "attestation"],
        eligibilityRules: [
            { field: "state", operator: "equals", value: "Karnataka", description: "Must reside in Karnataka / be a Karnataka domicile." },
            { field: "studentStatus", operator: "equals", value: true, description: "Must be actively enrolled as a post-matric student in a recognized Karnataka institution." }
        ],
        requiredDocuments: [
            { documentId: "doc-sspid", documentName: "Student SSP ID / Aadhaar Number", name: "Student SSP ID / Aadhaar Number", required: true, isMandatory: true, sourceId: "src-ssp-karnataka", description: "Aadhaar Card and registered mobile number for SSP login." },
            { documentId: "doc-casteincome", documentName: "Caste and Income Certificate (RD Number)", name: "Caste and Income Certificate (RD Number)", required: true, isMandatory: true, sourceId: "src-ssp-karnataka", description: "RD Number issued by NadaKacheri / Revenue Department." },
            { documentId: "doc-marksheet", documentName: "SSLC Reg No & Previous Marksheet", name: "SSLC Reg No & Previous Marksheet", required: true, isMandatory: true, sourceId: "src-ssp-karnataka", description: "SSLC registration number and qualifying exam marksheet." },
            { documentId: "doc-eattestation", documentName: "e-Attestation Numbers", name: "e-Attestation Numbers", required: true, isMandatory: true, sourceId: "src-ssp-karnataka", description: "e-Attested Study Certificate, Fee Receipt, and College Admission Proof." },
            { documentId: "doc-bankbook", documentName: "Aadhaar-Seeded Bank Account Passbook", name: "Aadhaar-Seeded Bank Account Passbook", required: true, isMandatory: true, sourceId: "src-ssp-karnataka", description: "Bank account linked with Aadhaar NPCI mapper for DBT." }
        ],
        procedureSteps: [
            { stepNumber: 1, title: "Create Account on SSP Portal", description: "Visit ssp.postmatric.karnataka.gov.in and create a student account using Aadhaar and mobile number.", sourceId: "src-ssp-karnataka" },
            { stepNumber: 2, title: "Fetch Caste & Income Details", description: "Enter the RD Number of the Caste and Income Certificate to automatically fetch verified records.", sourceId: "src-ssp-karnataka" },
            { stepNumber: 3, title: "Get Documents e-Attested", description: "Submit original Study Certificate and Fee Receipt to college e-Attestation officer to get e-Attestation numbers.", sourceId: "src-ssp-karnataka" },
            { stepNumber: 4, title: "Fill Application & Course Details", description: "Log in to SSP portal, enter SSLC registration number, college, course, and e-attestation IDs.", sourceId: "src-ssp-karnataka" },
            { stepNumber: 5, title: "Verify Bank NPCI Seeding & Submit", description: "Verify Aadhaar-bank account seeding status and submit the post-matric scholarship application online.", sourceId: "src-ssp-karnataka" },
            { stepNumber: 6, title: "Track Verification & Disbursal", description: "Track institutional verification and departmental sanction on the SSP portal until DBT fee reimbursement.", sourceId: "src-ssp-karnataka" }
        ],
        applicationMethods: ["Online (SSP Post-Matric Portal - ssp.postmatric.karnataka.gov.in)"],
        fees: "Free of cost",
        deadlines: "Annually notified per academic session (typically October to January)",
        processingTime: "2 to 3 months following e-Attestation and Departmental sanction",
        grievanceRoute: {
            authority: "Karnataka Social Welfare / Backward Classes / Tribal Welfare Department (SSP Cell)",
            description: "Grievance redressal for SSP portal login issues, e-Attestation failures, RD number validation errors, or scholarship payment delays.",
            url: "https://ssp.postmatric.karnataka.gov.in/",
            portal: "SSP Grievance & Helpdesk Portal / e-Swathu / Spandana",
            contact: "Social Welfare Helpline: 080-22634300 | Technical Helpdesk: 080-22370281 | Email: ssphelpdesk@karnataka.gov.in"
        }
    }),
    make("central-pmjay", "Ayushman Bharat PM-JAY", "Health", "src-pmjay", {
        keywords: ["health", "hospital", "insurance", "ayushman", "pmjay", "medical"],
        eligibilityRules: [
            { field: "bplStatus", operator: "equals", value: true, description: "Must belong to SECC 2011 / BPL eligible family category or senior citizen 70+." }
        ],
        requiredDocuments: [
            { documentId: "doc-aadhaar", documentName: "Aadhaar Card", name: "Aadhaar Card", required: true, isMandatory: true, sourceId: "src-pmjay", description: "Identity verification for beneficiary." },
            { documentId: "doc-rationcard", documentName: "Ration Card / Family ID", name: "Ration Card / Family ID", required: true, isMandatory: true, sourceId: "src-pmjay", description: "Proof of family membership and eligibility." },
            { documentId: "doc-seccproof", documentName: "SECC / PM-JAY Family Eligibility Document", name: "SECC / PM-JAY Family Eligibility Document", required: true, isMandatory: true, sourceId: "src-pmjay", description: "Official eligibility letter or SECC 2011 record proof." }
        ],
        procedureSteps: [
            { stepNumber: 1, title: "Check Eligibility Online", description: "Visit beneficiary.nha.gov.in and check eligibility using Mobile Number, Aadhaar Number, or Ration Card.", sourceId: "src-pmjay" },
            { stepNumber: 2, title: "Visit Empanelled Hospital", description: "Visit any empanelled public or private hospital or Ayushman Kiosk.", sourceId: "src-pmjay" },
            { stepNumber: 3, title: "Meet Ayushman Mitra", description: "Present Aadhaar and Ration Card to the Ayushman Mitra at the hospital kiosk for e-KYC.", sourceId: "src-pmjay" },
            { stepNumber: 4, title: "e-KYC Authentication", description: "Undergo biometric or Aadhaar OTP authentication to generate/verify Ayushman Card.", sourceId: "src-pmjay" },
            { stepNumber: 5, title: "Avail Cashless Treatment", description: "Receive cashless medical treatment for secondary and tertiary care up to Rs. 5 Lakhs per family per year.", sourceId: "src-pmjay" }
        ],
        applicationMethods: ["Online (NHA Beneficiary Portal)", "Empanelled Hospital Kiosk (Ayushman Mitra)", "Common Service Centre (CSC)"],
        fees: "Free of cost (Fully cashless coverage up to Rs. 5 Lakhs per family per year)",
        deadlines: "None (Open throughout the year)",
        processingTime: "On-spot e-KYC and instant Ayushman Card generation",
        grievanceRoute: {
            authority: "National Health Authority (NHA) / State Health Agency (SHA)",
            description: "File grievances regarding empanelled hospital denial of treatment, overcharging, or card generation issues.",
            url: "https://cgrms.pmjay.gov.in",
            portal: "Centralized Grievance Redressal Management System (CGRMS)",
            contact: "National Toll-Free Helpline: 14555 | 1800-111-565"
        }
    }),
    make("central-aadhaar", "Aadhaar Services", "Identity/Documents", "src-uidai", {
        keywords: ["aadhaar", "identity", "uidai", "card", "biometric", "address"],
        eligibilityRules: [],
        requiredDocuments: [
            { documentId: "doc-poi", documentName: "Proof of Identity (PoI)", name: "Proof of Identity (PoI)", required: true, isMandatory: true, sourceId: "src-uidai", description: "Passport, PAN Card, Voter ID, or Driving License." },
            { documentId: "doc-poa", documentName: "Proof of Address (PoA)", name: "Proof of Address (PoA)", required: true, isMandatory: true, sourceId: "src-uidai", description: "Bank Passbook, Electricity Bill, Ration Card, or Passport." },
            { documentId: "doc-pob", documentName: "Proof of Date of Birth (PoDB)", name: "Proof of Date of Birth (PoDB)", required: true, isMandatory: true, sourceId: "src-uidai", description: "Birth Certificate, SSLC Certificate, or Passport." },
            { documentId: "doc-por", documentName: "Proof of Relationship (PoR)", name: "Proof of Relationship (PoR)", required: false, isMandatory: false, sourceId: "src-uidai", description: "Required for Head of Family (HoF) based enrolment." }
        ],
        procedureSteps: [
            { stepNumber: 1, title: "Locate Center or Book Online", description: "Locate an official Aadhaar Seva Kendra (ASK) or book an online appointment via myaadhaar.uidai.gov.in.", sourceId: "src-uidai" },
            { stepNumber: 2, title: "Submit Enrolment Form", description: "Fill out the Enrolment / Update Form and present original PoI, PoA, and PoDB documents.", sourceId: "src-uidai" },
            { stepNumber: 3, title: "Capture Biometrics & Photo", description: "Provide facial photo, 10 fingerprint scans, and 2 iris scans at the enrolment workstation.", sourceId: "src-uidai" },
            { stepNumber: 4, title: "Collect Acknowledgement Slip", description: "Receive an Acknowledgement Slip containing the 14-digit Enrolment ID (EID) and date-time stamp.", sourceId: "src-uidai" },
            { stepNumber: 5, title: "Download e-Aadhaar", description: "Track enrolment status online and download e-Aadhaar PDF from myAadhaar portal once generated.", sourceId: "src-uidai" }
        ],
        applicationMethods: ["Aadhaar Seva Kendra (Offline)", "Online Appointment / Portal (myAadhaar)"],
        fees: "Free for new enrolment; Rs. 50 for demographic update, Rs. 100 for biometric update",
        deadlines: "None (Open throughout the year)",
        processingTime: "Up to 90 days from enrolment date",
        grievanceRoute: {
            authority: "Unique Identification Authority of India (UIDAI)",
            description: "File grievances regarding enrolment delays, update errors, or non-delivery of Aadhaar card.",
            url: "https://uidai.gov.in",
            portal: "UIDAI Public Grievance Portal / myAadhaar",
            contact: "Toll-Free Helpline: 1947 | Email: help@uidai.gov.in"
        }
    }),
    make("central-pmay", "Pradhan Mantri Awas Yojana - Urban", "Housing", "src-pmay", {
        eligibilityRules: [
            { field: "ownsPuccaHouse", operator: "equals", value: false, description: "Must not own a pucca (permanent) house anywhere in India." },
            { field: "annualIncome", operator: "less_than_or_equal", value: 900000, description: "Household annual income must not exceed Rs. 9 Lakhs." }
        ],
        requiredDocuments: [
            { documentId: "doc-aadhaar", documentName: "Aadhaar Card", name: "Aadhaar Card", required: true, isMandatory: true, sourceId: "src-pmay", description: "Identity verification for all family members." },
            { documentId: "doc-pancard", documentName: "PAN Card", name: "PAN Card", required: true, isMandatory: true, sourceId: "src-pmay", description: "Income and identity verification." },
            { documentId: "doc-incomeproof", documentName: "Income Certificate / ITR / Salary Slips", name: "Income Certificate / ITR / Salary Slips", required: true, isMandatory: true, sourceId: "src-pmay", description: "Salary slips, Form 16, or ITR for self-employed to prove EWS/LIG/MIG category." },
            { documentId: "doc-bankbook", documentName: "Bank Account Passbook", name: "Bank Account Passbook", required: true, isMandatory: true, sourceId: "src-pmay", description: "For subsidy disbursement." },
            { documentId: "doc-landdocs", documentName: "Property/Land Title Documents", name: "Property/Land Title Documents", required: false, isMandatory: false, sourceId: "src-pmay", description: "Required if applying under Beneficiary Led Construction (BLC) vertical." }
        ],
        procedureSteps: [
            { stepNumber: 1, title: "Access PMAY-U Portal", description: "Access the official PMAY-Urban portal (pmaymis.gov.in) or visit a local Urban Local Body (ULB) / Common Service Centre (CSC).", sourceId: "src-pmay" },
            { stepNumber: 2, title: "Fill Registration Form", description: "Register using Aadhaar and fill out the detailed application form with personal, income, and house details.", sourceId: "src-pmay" },
            { stepNumber: 3, title: "Upload Documents", description: "Upload mandatory documents including income proof, PAN, bank passbook, and property papers.", sourceId: "src-pmay" },
            { stepNumber: 4, title: "Pay Application Fee", description: "Pay the minimal application processing fee.", sourceId: "src-pmay" },
            { stepNumber: 5, title: "Verification and Inspection", description: "Track the application status online; local authority inspects the site or verifies documentation.", sourceId: "src-pmay" },
            { stepNumber: 6, title: "Subsidy Disbursement", description: "Post-verification, the subsidy is credited directly to the loan account (for CLSS) or construction funds are released in stages (for BLC).", sourceId: "src-pmay" }
        ],
        applicationMethods: ["Online (PMAY-Urban Portal)", "Urban Local Body (ULB) Office", "Common Service Centre (CSC)"],
        fees: "Rs. 25 processing/registration fee",
        deadlines: "As announced by the Ministry for specific phases/verticals",
        processingTime: "3 to 6 months",
        grievanceRoute: {
            authority: "Ministry of Housing and Urban Affairs (MoHUA)",
            description: "Redressal for issues regarding subsidy status, application rejection, or payment delay.",
            url: "https://pgportal.gov.in",
            portal: "Centralized Public Grievance Redress and Monitoring System (CPGRAMS)",
            contact: "Helpline numbers: 1800-11-3377, 1800-11-3388, 1800-11-6163"
        }
    }),
    make("central-pmmvy", "Pradhan Mantri Matru Vandana Yojana", "Women/Child Welfare", "src-wcd", {
        keywords: ["matru", "vandana", "pmmvy", "pregnant", "mother", "child", "welfare", "maternity"],
        eligibilityRules: [
            { field: "gender", operator: "equals", value: "Female", description: "Applicant must be a pregnant woman or lactating mother." },
            { field: "annualIncome", operator: "less_than_or_equal", value: 800000, description: "Annual household income must not exceed Rs. 8 Lakhs." }
        ],
        requiredDocuments: [
            { documentId: "doc-aadhaar", documentName: "Aadhaar Card", name: "Aadhaar Card", required: true, isMandatory: true, sourceId: "src-wcd", description: "Identity and address proof of the mother." },
            { documentId: "doc-mcpcard", documentName: "Mother and Child Protection (MCP) Card", name: "Mother and Child Protection (MCP) Card", required: true, isMandatory: true, sourceId: "src-wcd", description: "Registered MCP card with Anganwadi Centre or Health Facility." },
            { documentId: "doc-bankbook", documentName: "Bank / Post Office Account Passbook", name: "Bank / Post Office Account Passbook", required: true, isMandatory: true, sourceId: "src-wcd", description: "Aadhaar-linked bank account for Direct Benefit Transfer (DBT)." },
            { documentId: "doc-incomeproof", documentName: "Income Certificate / BPL Card / MGNREGA Job Card", name: "Income Certificate / BPL Card / MGNREGA Job Card", required: true, isMandatory: true, sourceId: "src-wcd", description: "Proof of eligibility under socially/economically disadvantaged category." }
        ],
        procedureSteps: [
            { stepNumber: 1, title: "Register at Anganwadi / Health Facility", description: "Register at local Anganwadi Centre (AWC) or approved Government Health Facility within 560 days of LMP.", sourceId: "src-wcd" },
            { stepNumber: 2, title: "Submit Application Form", description: "Fill PMMVY application form along with MCP card details, Aadhaar, and bank passbook.", sourceId: "src-wcd" },
            { stepNumber: 3, title: "Verification by Anganwadi Worker", description: "Anganwadi Worker (AWW) / ANM verifies the details and submits to the PMMVY portal.", sourceId: "src-wcd" },
            { stepNumber: 4, title: "Claim Installments", description: "Claim 1st installment upon ANC registration and 2nd installment upon child birth registration & initial immunization.", sourceId: "src-wcd" },
            { stepNumber: 5, title: "DBT Payment Credit", description: "Financial cash incentive is directly credited into beneficiary's bank account.", sourceId: "src-wcd" }
        ],
        applicationMethods: ["Online (PMMVY Portal - pmmvy.wcd.gov.in)", "Offline (Anganwadi Centre / Health Facility)"],
        fees: "Free of cost",
        deadlines: "Must apply within 570 days from the date of Last Menstrual Period (LMP)",
        processingTime: "30 to 60 days per installment payout",
        grievanceRoute: {
            authority: "Ministry of Women and Child Development (MWCD) / PMMVY Cell",
            description: "Redressal for delayed PMMVY installment credit, Anganwadi verification issues, or portal registration errors.",
            url: "https://wcd.gov.in",
            portal: "PMMVY Grievance Portal / CPGRAMS",
            contact: "PMMVY Helpline: 011-23382393 | 1800-11-6555"
        }
    }),
    make("central-igold", "Indira Gandhi National Old Age Pension Scheme", "Finance/Social Security", "src-nsap", {
        eligibilityRules: [
            { field: "age", operator: "greater_than_or_equal", value: 60, description: "Applicant must be 60 years of age or older." },
            { field: "bplStatus", operator: "equals", value: true, description: "Applicant must belong to a household living Below the Poverty Line (BPL)." }
        ],
        requiredDocuments: [
            { documentId: "doc-aadhaar", documentName: "Aadhaar Card", name: "Aadhaar Card", required: true, isMandatory: true, sourceId: "src-nsap", description: "Identity and address verification." },
            { documentId: "doc-bplproof", documentName: "BPL Ration Card or Certificate", name: "BPL Ration Card or Certificate", required: true, isMandatory: true, sourceId: "src-nsap", description: "Proof of Below Poverty Line (BPL) status." },
            { documentId: "doc-ageproof", documentName: "Age Proof Document", name: "Age Proof Document", required: true, isMandatory: true, sourceId: "src-nsap", description: "Birth certificate, school leaving certificate, or Voter ID." },
            { documentId: "doc-bankbook", documentName: "Bank Account Passbook", name: "Bank Account Passbook", required: true, isMandatory: true, sourceId: "src-nsap", description: "For direct pension transfers (DBT)." },
            { documentId: "doc-photo", documentName: "Passport-sized Photograph", name: "Passport-sized Photograph", required: true, isMandatory: true, sourceId: "src-nsap", description: "Recent photo for registration." }
        ],
        procedureSteps: [
            { stepNumber: 1, title: "Obtain Application Form", description: "Download NSAP application form online from the official NSAP portal or obtain from Block Development Office (BDO) or Gram Panchayat.", sourceId: "src-nsap" },
            { stepNumber: 2, title: "Attach Supporting Documents", description: "Fill details and attach proof of age, BPL card, Aadhaar card, bank details, and photos.", sourceId: "src-nsap" },
            { stepNumber: 3, title: "Submit Form", description: "Submit completed application to the Gram Panchayat/BDO (rural) or Municipal Office (urban).", sourceId: "src-nsap" },
            { stepNumber: 4, title: "Verification Process", description: "Local authorities carry out verification of BPL status and age.", sourceId: "src-nsap" },
            { stepNumber: 5, title: "Pension Disbursal", description: "Sanctioning authority reviews and issues the pension order; pension starts getting credited to the bank account.", sourceId: "src-nsap" }
        ],
        applicationMethods: ["Offline (Gram Panchayat / Block Office / Municipality)", "Online (NSAP Portal)", "Common Service Centre (CSC)"],
        fees: "Free of cost",
        deadlines: "None (Open throughout the year)",
        processingTime: "30 to 45 days",
        grievanceRoute: {
            authority: "Ministry of Rural Development / District Social Welfare Officer",
            description: "Redressal for delayed pension transfers, application rejection, or verification errors.",
            url: "https://pgportal.gov.in",
            portal: "Centralized Public Grievance Redress and Monitoring System (CPGRAMS)",
            contact: "Contact local BDO or Municipal Social Welfare Department."
        }
    }),
    make("central-udid", "Unique Disability ID (UDID)", "Disability/Accessibility", "src-udid", {
        keywords: ["udid", "disability", "swavlamban", "handicapped", "pwd", "disabled", "accessibility"],
        eligibilityRules: [
            { field: "disabilityStatus", operator: "equals", value: true, description: "Applicant must be a person with benchmark disability (40% or more)." }
        ],
        requiredDocuments: [
            { documentId: "doc-aadhaar", documentName: "Aadhaar Card / Proof of Identity", name: "Aadhaar Card / Proof of Identity", required: true, isMandatory: true, sourceId: "src-udid", description: "Proof of identity (Aadhaar Card, Voter ID, Passport)." },
            { documentId: "doc-addressproof", documentName: "Proof of Address", name: "Proof of Address", required: true, isMandatory: true, sourceId: "src-udid", description: "Proof of residence in India." },
            { documentId: "doc-photo", documentName: "Passport-sized Photograph", name: "Passport-sized Photograph", required: true, isMandatory: true, sourceId: "src-udid", description: "Recent passport photo." },
            { documentId: "doc-disabilitycert", documentName: "Disability Certificate / Medical Report", name: "Disability Certificate / Medical Report", required: false, isMandatory: false, sourceId: "src-udid", description: "Existing disability certificate issued by competent medical authority (if available)." }
        ],
        procedureSteps: [
            { stepNumber: 1, title: "Register on Swavlamban Portal", description: "Visit swavlambancard.gov.in and click on 'Apply for Disability Certificate & UDID Card'.", sourceId: "src-udid" },
            { stepNumber: 2, title: "Fill Personal & Disability Details", description: "Enter personal, address, educational, and disability details in the online application form.", sourceId: "src-udid" },
            { stepNumber: 3, title: "Upload Scanned Documents", description: "Upload Aadhaar card, address proof, photograph, and existing medical certificates.", sourceId: "src-udid" },
            { stepNumber: 4, title: "Submit & Get Enrolment Number", description: "Submit application to generate temporary UDID enrolment number.", sourceId: "src-udid" },
            { stepNumber: 5, title: "Medical Board Assessment", description: "Visit designated District Hospital / Medical Board for disability evaluation and percentage certification.", sourceId: "src-udid" },
            { stepNumber: 6, title: "UDID Card Dispatch", description: "Upon Medical Board approval, Unique Disability ID (UDID) Smart Card is issued and dispatched to applicant's home address.", sourceId: "src-udid" }
        ],
        applicationMethods: ["Online (Swavlamban Card Portal - swavlambancard.gov.in)", "District Disability Rehabilitation Centre (DDRC)", "Common Service Centre (CSC)"],
        fees: "Free of cost",
        deadlines: "None (Open throughout the year)",
        processingTime: "1 to 3 months following medical assessment",
        grievanceRoute: {
            authority: "Department of Empowerment of Persons with Disabilities (DEPwD) / UDID Division",
            description: "File grievances regarding delay in medical assessment, UDID card dispatch, or profile correction.",
            url: "https://www.swavlambancard.gov.in",
            portal: "Swavlamban Public Grievance Portal / CPGRAMS",
            contact: "UDID Helpdesk Phone: 011-24365019 | Email: support.udid-depwd@gov.in"
        }
    }),
    make("state-delhi-edistrict", "Delhi e-District Citizen Services", "General Citizen Services", "src-delhi", {
        description: "Centralized online portal of the Government of NCT of Delhi for issuing statutory certificates (Domicile, Income, Caste, Birth/Death) and citizen revenue services.",
        keywords: ["delhi", "edistrict", "revenue", "domicile", "certificate", "income", "caste", "citizen"],
        eligibilityRules: [
            { field: "state", operator: "equals", value: "Delhi", description: "Must be a resident / domicile of the National Capital Territory (NCT) of Delhi." }
        ],
        requiredDocuments: [
            { documentId: "doc-aadhaar", documentName: "Aadhaar Card", name: "Aadhaar Card", required: true, isMandatory: true, sourceId: "src-delhi", description: "Identity proof of the applicant." },
            { documentId: "doc-addressproof", documentName: "Proof of Residence in Delhi", name: "Proof of Residence in Delhi", required: true, isMandatory: true, sourceId: "src-delhi", description: "Voter ID, Passport, Electricity Bill, Ration Card, or Water Bill." },
            { documentId: "doc-photo", documentName: "Passport-sized Photograph", name: "Passport-sized Photograph", required: true, isMandatory: true, sourceId: "src-delhi", description: "Recent photograph of the applicant." },
            { documentId: "doc-selfdecl", documentName: "Self-Declaration Form", name: "Self-Declaration Form", required: true, isMandatory: true, sourceId: "src-delhi", description: "Self-declaration in prescribed format as mandated by e-District Delhi." },
            { documentId: "doc-serviceproof", documentName: "Service-Specific Document", name: "Service-Specific Document", required: false, isMandatory: false, sourceId: "src-delhi", description: "Additional document depending on the chosen service (e.g., salary slip for income cert, old caste cert for caste certificate)." }
        ],
        procedureSteps: [
            { stepNumber: 1, title: "Citizen Registration or Login", description: "Visit edistrict.delhigovt.nic.in and register as a new user using Aadhaar Number or Voter ID Card (EPIC).", sourceId: "src-delhi" },
            { stepNumber: 2, title: "Select Required Service", description: "Log in with credentials, navigate to 'Apply Online', and select the required revenue service or certificate.", sourceId: "src-delhi" },
            { stepNumber: 3, title: "Fill Online Application Form", description: "Enter applicant details, family background, local Delhi address, and service-specific particulars.", sourceId: "src-delhi" },
            { stepNumber: 4, title: "Upload Scanned Documents", description: "Upload mandatory documents including Aadhaar card, Delhi residence proof, photograph, and Self-Declaration form.", sourceId: "src-delhi" },
            { stepNumber: 5, title: "Submit & Obtain Application Number", description: "Submit application online to generate an Acknowledgement Slip with a 14-digit Application Tracking Number.", sourceId: "src-delhi" },
            { stepNumber: 6, title: "Verification & Certificate Download", description: "After verification by local Sub-Divisional Magistrate (SDM) / Tehsildar office, track status and download digitally signed certificate.", sourceId: "src-delhi" }
        ],
        applicationMethods: ["Online (Delhi e-District Portal - edistrict.delhigovt.nic.in)", "Citizen Service Centre (CSC) / District Revenue Office"],
        fees: "Free for online application; nominal CSC service charges if applied at physical counter",
        deadlines: "None (Services available throughout the year)",
        processingTime: "14 to 30 days depending on the specific certificate/service",
        grievanceRoute: {
            authority: "Revenue Department / Public Grievance Monitoring System (PGMS), Govt of NCT of Delhi",
            description: "Redressal for application delays, document rejection, or e-District portal login and tracking issues.",
            url: "https://edistrict.delhigovt.nic.in/",
            portal: "Delhi e-District Grievance Redressal / PGMS Delhi",
            contact: "Helpline Phones: 011-23935730, 011-23935731 | Email: edistrict-helpdesk@delhi.gov.in"
        }
    }),
];

module.exports = { sources, services };
