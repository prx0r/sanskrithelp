#!/usr/bin/env python3
"""
Fetch Vijñānabhairava — first 5 of the 112 dhāraṇās (verses 24-28).
Full 112 requires parsing vijnanabhairavatantra.com + Jaideva Singh djvu.
Output: public/content/readings/vijnanabhairava/units.json
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent

# First 5 of 112 meditation techniques (verses 24-28, Jaideva Singh)
UNITS = [
    ("ऊर्ध्वे प्राणो ह्यधो जीवो विसर्गात्मा परोच्चरेत्। उत्पत्तिद्वितयस्थाने भरणाद्भरिता स्थितिः॥२४॥",
     "ūrdhve prāṇo hy adho jīvo visargātmā paroccaret| utpattidvitayasthāne bharaṇād bharitā sthitiḥ||24||",
     "The breath going upward (ūrdhva) and the vital force (jīva) going downward are to be exhaled through the power of emission. The state of fullness arises from filling the two points of emergence."),
    ("मरुतोऽन्तर् बहिर् वापि वियद्युग्मानिवर्तनात्। भैरव्यां भैरवस्येत्थं भैरवी व्यज्यते वपुः॥२५॥",
     "maruto 'ntar bahir vāpi viyadyugmānivartanāt| bhairavyāṁ bhairavasyetthaṁ bhairavī vyajyate vapuḥ||25||",
     "By the movement of the pair of energies within or without, through the void, the divine form of Bhairava is manifested in the Goddess."),
    ("न व्रजेन् न विशेच् शक्तिर् मरुद्रूपा विकासिते। निर्विकल्पतया मध्ये तया भैरवरूपता॥२६॥",
     "na vrajen na viśec chaktir marudrūpā vikāsite| nirvikalpatayā madhye tayā bhairavarūpatā||26||",
     "The energy in the form of breath does not go out or go in when expanded. By that non-conceptual state in the middle, the nature of Bhairava is attained."),
    ("कुम्भिता रेचिता वापि पूरिता वा यदा भवेत्। तदन्ते शान्तनामासौ शक्त्या शान्तः प्रकाशते॥२७॥",
     "kumbhitā recitā vāpi pūritā vā yadā bhavet| tadante śāntanāmāsau śaktyā śāntaḥ prakāśate||27||",
     "When (the breath) is restrained, exhaled, or filled, at the end of that (practice), he whose name is Peace shines forth through the power (śakti)."),
    ("आमूलात् किरणाभासां सूक्ष्मात् सूक्ष्मतरात्मिकम्। चिन्तयेत्तां द्विषट्कान्ते श्यामयन्तीं भैरवोदयः॥२८॥",
     "āmūlāt kiraṇābhāsāṁ sūkṣmāt sūkṣmatarātmikam| cintayettāṁ dviṣaṭkānte śyāmayantīṁ bhairavodayaḥ||28||",
     "Meditate on that (energy) extending from the root to the end of the twelve (finger-widths), becoming more subtle from the subtle, darkening (in color)—thus the arising of Bhairava."),
]


def main() -> None:
    out_dir = ROOT / "public" / "content" / "readings" / "vijnanabhairava"
    out_dir.mkdir(parents=True, exist_ok=True)

    units = []
    for i, (devanagari, iast, english) in enumerate(UNITS):
        units.append({
            "id": f"vb_{i+1:03d}",
            "sequence": i + 1,
            "devanagari": devanagari.replace("।", "").replace("॥", "").strip(),
            "iast": iast.split("|")[0].strip() if "|" in iast else iast.strip(),
            "english": english,
            "source": "Jaideva Singh, Vijñānabhairava",
        })

    out_path = out_dir / "units.json"
    out_path.write_text(json.dumps(units, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(units)} units to {out_path}")


if __name__ == "__main__":
    main()
