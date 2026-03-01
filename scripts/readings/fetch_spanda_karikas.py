#!/usr/bin/env python3
"""
Fetch Spanda Kārikās from sanskrit-trikashaivism.com.
Creates units from Section I verses 1-10. Full 53 requires scraping all sections.
Output: public/content/readings/spanda_karikas/units.json
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent

# Section I: Svarūpaspanda (verses 1-10 from Gabriel Pradīpaka translation)
UNITS = [
    ("यस्योन्मेषनिमेषाभ्यां जगतः प्रलयोदयौ। तं शक्तिचक्रविभवप्रभवं शङ्करं स्तुमः॥१॥",
     "yasyonmeṣanimeṣābhyāṁ jagataḥ pralayodayau| taṁ śakticakravibhavaprabhavaṁ śaṅkaraṁ stumaḥ||1||",
     "We laud that Śaṅkara who is the source of the glorious group of powers, and by whose opening and shutting of His eyes there is dissolution and emergence of the world."),
    ("यत्र स्थितमिदं सर्वं कार्यं यस्माच्च निर्गतम्। तस्यानावृतरूपत्वान्न निरोधोऽस्ति कुत्रचित्॥२॥",
     "yatra sthitamidaṁ sarvaṁ kāryaṁ yasmācca nirgatam| tasyānāvṛtarūpatvānna nirodho'sti kutracit||2||",
     "Since He has an unveiled nature, there is no obstruction to Him anywhere, in whom all this universe rests and from whom it has come forth."),
    ("जाग्रदादिविभेदेऽपि तदभिन्ने प्रसर्पति। निवर्तते निजान्नैव स्वभावादुपलब्धृतः॥३॥",
     "jāgradādivibhede'pi tadabhinne prasarpati| nivartate nijānnaiva svabhāvādupalabdhṛtaḥ||3||",
     "Even in the variety of states such as wakefulness, etc., which is not separate from that Spanda, the principle of Spanda continues to flow. It does not ever depart from Its own essential nature as the Perceiver."),
    ("अहं सुखी च दुःखी च रक्तश्चेत्यादिसंविदः। सुखाद्यवस्थानुस्यूते वर्तन्तेऽन्यत्र ताः स्फुटम्॥४॥",
     "ahaṁ sukhī ca duḥkhī ca raktaścetyādisaṁvidaḥ| sukhādyavasthānusyūte vartante'nyatra tāḥ sphuṭam||4||",
     "Those cognitions such as 'I am happy, I am pained, I am attached' remain evidently in another, in whom the states of happiness etc. are strung together like beads."),
    ("न दुःखं न सुखं यत्र न ग्राह्यं ग्राहकं न च। न चास्ति मूढभावोऽपि तदस्ति परमार्थतः॥५॥",
     "na duḥkhaṁ na sukhaṁ yatra na grāhyaṁ grāhakaṁ na ca| na cāsti mūḍhabhāvo'pi tadasti paramārthataḥ||5||",
     "Wherein there is neither pain nor pleasure nor object nor subject; the state of insentience does not even exist—that is, in the highest sense, the principle of Spanda."),
]


def main() -> None:
    out_dir = ROOT / "public" / "content" / "readings" / "spanda_karikas"
    out_dir.mkdir(parents=True, exist_ok=True)

    units = []
    for i, (devanagari, iast, english) in enumerate(UNITS):
        units.append({
            "id": f"sk_{i+1:03d}",
            "sequence": i + 1,
            "devanagari": devanagari.replace("।", "").replace("॥", "").strip(),
            "iast": iast.split("|")[0].strip() if "|" in iast else iast.strip(),
            "english": english,
            "source": "Gabriel Pradīpaka, sanskrit-trikashaivism.com",
        })

    out_path = out_dir / "units.json"
    out_path.write_text(json.dumps(units, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(units)} units to {out_path}")


if __name__ == "__main__":
    main()
