#!/usr/bin/env python3
"""
Fetch Śiva Sūtras (1-39) from Hareesh.org - Christopher Wallis translation.
Full 77 require Subhash Kak PDF. Output: public/content/readings/siva_sutras/units.json
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent

# Hareesh 1-39: devanagari + English (from blog post)
UNITS = [
    ("चैतन्यमात्मा", "caitanyam ātmā", "Consciousness is the Self."),
    ("अज्ञानं बन्धः", "(a)jñānaṃ bandhaḥ", "Ignorance is bondage. / Knowledge is bondage."),
    ("योनिवर्गः कलाशरीरम्", "yonivargaḥ kalāśarīram", "The group of sources is the body of powers."),
    ("ज्ञानाधिष्ठानं मातृका", "jñānādhiṣṭhānaṃ mātṛkā", "The matrix [of language] is the foundation of knowledge."),
    ("उद्यमो भैरवः", "udyamo bhairavaḥ", "The 'upwelling' is Bhairava. / Bhairava is the primordial dynamism [of consciousness]."),
    ("शक्तिचक्रसंधाने विश्वसंहारः", "śakti-cakra-saṃdhāne viśva-saṃhāraḥ", "When one unites with the circle of Powers, the universe is withdrawn."),
    ("जाग्रत्स्वप्नसुसुप्तभेदे तुर्याभोगसम्भवः", "jāgrat-svapna-susupta-bhede turyābhoga-sambhavaḥ", "[Then] arises the expansion of the Fourth state into the divisions of waking, dreaming, and deep sleep."),
    ("ज्ञानं जाग्रत्", "jñānaṃ jāgrat", "The \"waking state\" refers to cognitive activity."),
    ("स्वप्नो विकल्पाः", "svapno vikalpāḥ", "\"Dream\" means mental constructs."),
    ("अविवेको माया सौषुप्तम्", "aviveko māyā sauṣuptam", "\"Deep sleep\" means non-discernment, self-concealment."),
    ("त्रितयभोक्ता वीरेशः", "tritaya-bhoktā vīreśaḥ", "One who experiences these three [as the Fourth state] is the 'Lord of Heroes'."),
    ("विस्मयो योगभूमिकाः", "vismayo yogabhūmikāḥ", "The stages of yoga are wondrous."),
    ("इच्छा शक्तिरुमा कुमारी", "icchā śaktir umā kumārī", "The Power of Will is the Maiden Umā."),
    ("दृश्यं शरीरम्", "dṛśyaṃ śarīram", "All that is perceptible is the body."),
    ("हृदये चित्तसङ्घट्टाद् दृश्यस्वापदर्शनम्", "hṛdaye citta-saṅghaṭṭād dṛśya-svāpa-darśanam", "By fusion of the mind with the Heart [of Awareness], there arises the vision of [both] the perceptible world and the void."),
    ("शुद्धतत्त्वसन्धानाद्वा स्वपदशक्तिरपशुशक्तिः", "śuddha-tattva-sandhānād vā svapada-śaktiḥ apaśu-śaktiḥ", "Through contemplation of the Pure Principle, Energy [comes to rest] in her own abode."),
    ("वितर्क आत्मज्ञानम्", "vitarka ātma-jñānam", "Wordless reflection leads to insight into the nature of the Self."),
    ("लोकानन्दः समाधिसुखम्", "lokānandaḥ samādhi-sukham", "The bliss of [the unity of] the objective & subjective worlds is maintained through the pleasure of mindfulness."),
    ("शक्तिसन्धाने शरीरोत्पत्तिः", "śakti-sandhāne śarīrotpattiḥ", "When the energies unite, the body arises."),
    ("भूतसन्धानभूतपृथक्त्वविश्वसंघट्टः", "bhūta-sandhāna-bhūta-pṛthaktva-viśva-saṃghaṭṭaḥ", "Synthesizing elements, separating elements, and the intimate union of all things."),
    ("शुद्धविद्योदयाच्चक्रेशत्वसिद्धिः", "śuddha-vidyodayāc cakreśatva-siddhiḥ", "Due to the arising of pure wisdom, there is the attainment of the mastery of the Wheel."),
    ("महाह्रदानुसंधानान्मन्त्रवीर्यानुभवः", "mahāhradānusaṃdhānān mantravīryānubhavaḥ", "Due to contemplating & merging with the Great Lake, one experiences that which invigorates mantras."),
    ("चित्तं मन्त्रः", "cittaṃ mantraḥ", "The mind is Mantra."),
    ("प्रयत्नः साधकः", "prayatnaḥ sādhakaḥ", "Effort is effective."),
    ("विद्याशरीरसत्ता मन्त्ररहस्यम्", "vidyā-śarīra-sattā mantra-rahasyam", "The secret of mantra is the beingness of the body of wisdom."),
    ("गर्भे चित्तविकासो विशिष्टो विद्यास्वप्नः", "garbhe citta-vikāso viśiṣṭo vidyā-svapnaḥ", "The expansion of the heart-mind in the Womb is the exalted dream of the vidyā (wisdom-mantra)."),
    ("विद्यासमुत्थाने स्वाभाविके खेचरी शिवावस्था", "vidyā-samutthāne svābhāvike khecarī śivāvasthā", "When the insight that is inherent in one's essence-nature arises, there is the Śiva-state, that of roaming free in the Sky [of Consciousness]."),
    ("गुरुरुपायः", "gurur upāyaḥ", "The Guru is the means."),
    ("मातृकाचक्रसम्बोधः", "mātṛkā-cakra-sambodhaḥ", "The Awakening to the Matrix-Wheel."),
    ("शरीरं हविः", "śarīraṃ haviḥ", "The body is the offering."),
    ("ज्ञानमन्नम्", "jñānam annam", "Cognition is food. / Insight is nourishment."),
    ("विद्यासंहारे तदुत्थस्वप्नदर्शनम्", "vidyā-saṃhāre tad-uttha-svapna-darśanam", "When insight dissolves, there remain [merely] the visions and dreams arising from it."),
    ("आत्मा चित्तम्", "ātmā cittam", "The mind is the [conventional] self."),
    ("ज्ञानं बन्धः", "jñānaṃ bandhaḥ", "[The] cognition [of such self] constitutes bondage."),
    ("कलादीनां तत्त्वानामविवेको माया", "kalādīnāṃ tattvānām aviveko māyā", "Māyā is the lack of discernment regarding the tattvas from kalā (limited power of action) to Earth."),
    ("शरीरे संहारः कलानाम्", "śarīre saṃhāraḥ kalānām", "Dissolution of the limited powers in the body."),
    ("नाडीसंहारभूतजयभूतकैवल्यभूतपृथक्त्वानि", "nāḍīsaṃhāra-bhūtajaya-bhūtakaivalya-bhūtapṛthaktvāni", "Retraction of the channels, conquest of the elements, isolation from the elements, and separation of/from the elements."),
    ("मोहावरणात् सिद्धिः", "mohāvaraṇāt siddhiḥ", "Attainment [arises] due to covering (that is, restraining) delusion."),
    ("मोहजयादनन्ताभोगात् सहजविद्याजयः", "moha-jayād anantābhogāt sahaja-vidyā-jayaḥ", "One attains innate wisdom through the conquest of delusion, which [gives access to] the infinite expanse."),
]


def main() -> None:
    out_dir = ROOT / "public" / "content" / "readings" / "siva_sutras"
    out_dir.mkdir(parents=True, exist_ok=True)

    units = []
    for i, (devanagari, iast, english) in enumerate(UNITS):
        units.append({
            "id": f"ss_{i+1:03d}",
            "sequence": i + 1,
            "devanagari": devanagari.strip(),
            "iast": iast.strip(),
            "english": english.split(".")[0] + "." if "." in english else english,
            "source": "Christopher Wallis (Hareesh.org), 2023",
        })

    out_path = out_dir / "units.json"
    out_path.write_text(json.dumps(units, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(units)} units to {out_path}")


if __name__ == "__main__":
    main()
