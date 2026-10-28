NEW_ACTS = [
    {
        "title": "Protection of Women from Domestic Violence Act, 2005",
        "publisher": "Ministry of Women and Child Development",
        "official_url": "https://www.indiacode.nic.in/handle/123456789/2021",
        "jurisdiction": "IN",
        "source_type": "ACT",
        "trust_level": 1,
        "publication_date": "2005-09-13",
        "effective_date": "2006-10-26",
        "raw_text": """
Section 3. Definition of domestic violence.
Any act, omission or commission or conduct of the respondent shall constitute domestic violence in case it harms or injures or endangers the health, safety, life, limb or well-being, whether mental or physical, of the aggrieved person.

Section 12. Application to Magistrate.
(1) An aggrieved person or a Protection Officer or any other person on behalf of the aggrieved person may present an application to the Magistrate seeking one or more reliefs under this Act.

Section 18. Protection orders.
The Magistrate may, after giving the aggrieved person and the respondent an opportunity of being heard and on being prima facie satisfied that domestic violence has taken place, pass a protection order prohibiting the respondent from committing any act of domestic violence.

Section 19. Residence orders.
The Magistrate may pass an order restraining the respondent from dispossessing or in any other manner disturbing the possession of the aggrieved person from the shared household.
"""
    },
    {
        "title": "Real Estate (Regulation and Development) Act, 2016",
        "publisher": "Ministry of Housing and Urban Affairs",
        "official_url": "https://www.indiacode.nic.in/handle/123456789/2158",
        "jurisdiction": "IN",
        "source_type": "ACT",
        "trust_level": 1,
        "publication_date": "2016-03-26",
        "effective_date": "2016-05-01",
        "raw_text": """
Section 3. Prior registration of real estate project with Real Estate Regulatory Authority.
No promoter shall advertise, market, book, sell or offer for sale any plot, apartment or building in any real estate project without registering the real estate project with RERA.

Section 18. Return of amount and compensation.
(1) If the promoter fails to complete or is unable to give possession of an apartment, plot or building in accordance with the terms of the agreement for sale, he shall be liable on demand to the allottees to return the amount received by him with interest at such rate as may be prescribed.

Section 31. Filing of complaints with the Authority or the Adjudicating Officer.
Any aggrieved person may file a complaint with RERA for any violation or contravention of the provisions of this Act against any promoter, allottee or real estate agent.
"""
    },
    {
        "title": "Maintenance and Welfare of Parents and Senior Citizens Act, 2007",
        "publisher": "Ministry of Social Justice and Empowerment",
        "official_url": "https://www.indiacode.nic.in/handle/123456789/2056",
        "jurisdiction": "IN",
        "source_type": "ACT",
        "trust_level": 1,
        "publication_date": "2007-12-29",
        "effective_date": "2007-12-31",
        "raw_text": """
Section 4. Maintenance of parents and senior citizens.
(1) A senior citizen including parent who is unable to maintain himself from his own earning or out of the property owned by him, shall be entitled to make an application under section 5 against one or more of his children or relatives.

Section 9. Order for maintenance.
If children or relatives neglect or refuse to maintain a senior citizen, the Tribunal may order such children or relatives to make a monthly allowance for the maintenance of such senior citizen.

Section 23. Transfer of property to be void in certain circumstances.
Where any senior citizen who has transferred by way of gift or otherwise his property subject to the condition that the transferee shall provide the basic amenities and physical needs, and such transferee refuses, the transfer of property shall be deemed to have been made by fraud or coercion and shall be void at the option of the transferor.
"""
    },
    {
        "title": "Rights of Persons with Disabilities Act, 2016",
        "publisher": "Department of Empowerment of Persons with Disabilities",
        "official_url": "https://www.indiacode.nic.in/handle/123456789/2155",
        "jurisdiction": "IN",
        "source_type": "ACT",
        "trust_level": 1,
        "publication_date": "2016-12-28",
        "effective_date": "2017-04-19",
        "raw_text": """
Section 3. Equality and non-discrimination.
(1) The appropriate Government shall ensure that the persons with disabilities enjoy the right to equality, life with dignity and respect for his or her integrity equally with others.
(2) No person with disability shall be discriminated on the ground of disability.

Section 34. Reservation in employment.
Every appropriate Government shall appoint in every government establishment not less than four per cent of the total number of vacancies in the cadre strength in each group of posts meant to be filled with persons with benchmark disabilities.

Section 40. Accessibility standards.
The Central Government shall formulate rules laying down the standards of accessibility for the physical environment, transportation, information and communications including appropriate technologies and systems.
"""
    },
    {
        "title": "Information Technology Act, 2000",
        "publisher": "Ministry of Electronics and Information Technology",
        "official_url": "https://www.indiacode.nic.in/handle/123456789/1999",
        "jurisdiction": "IN",
        "source_type": "ACT",
        "trust_level": 1,
        "publication_date": "2000-06-09",
        "effective_date": "2000-10-17",
        "raw_text": """
Section 43A. Compensation for failure to protect data.
Where a body corporate possesses, deals or handles any sensitive personal data or information in a computer resource and is negligent in implementing and maintaining reasonable security practices, resulting in wrongful loss or gain, such body corporate shall be liable to pay damages by way of compensation.

Section 66. Computer related offences.
If any person, dishonestly or fraudulently, does any act referred to in section 43, he shall be punishable with imprisonment for a term which may extend to three years or with fine which may extend to five lakh rupees.

Section 66C. Punishment for identity theft.
Whoever, fraudulently or dishonestly make use of the electronic signature, password or any other unique identification feature of any other person, shall be punished with imprisonment of either description for a term which may extend to three years.
"""
    }
]

with open('data/seed/seed_data.py', 'r', encoding='utf-8') as f:
    text = f.read()

target = "    }\n]\n\n\nasync def seed_knowledge_base"
replacement = "    },\n"

import json
for act in NEW_ACTS:
    replacement += "    {\n"
    replacement += f'        "title": {json.dumps(act["title"])},\n'
    replacement += f'        "publisher": {json.dumps(act["publisher"])},\n'
    replacement += f'        "official_url": {json.dumps(act["official_url"])},\n'
    replacement += f'        "jurisdiction": {json.dumps(act["jurisdiction"])},\n'
    replacement += f'        "source_type": {json.dumps(act["source_type"])},\n'
    replacement += f'        "trust_level": SourceTrustLevel.OFFICIAL_LEGISLATION,\n'
    replacement += f'        "publication_date": {json.dumps(act["publication_date"])},\n'
    replacement += f'        "effective_date": {json.dumps(act["effective_date"])},\n'
    replacement += f'        "raw_text": {json.dumps(act["raw_text"])}\n'
    replacement += "    },\n"

replacement = replacement.rstrip(",\n") + "\n]\n\n\nasync def seed_knowledge_base"

if target in text:
    text = text.replace(target, replacement)
else:
    # Try CRLF
    target_crlf = "    }\r\n]\r\n\r\n\r\nasync def seed_knowledge_base"
    text = text.replace(target_crlf, replacement)

with open('data/seed/seed_data.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated seed_data.py with expanded corpus successfully")
