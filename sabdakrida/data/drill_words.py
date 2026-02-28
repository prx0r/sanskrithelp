"""
Drill word bank — curated words targeting specific phoneme distinctions.
Picks words containing the learner's worst phonemes for spaced repetition.
"""

DRILL_WORDS = {
    "retroflex_dental": ["ṭīkā", "ḍambara", "naṭa", "nāṭya", "ṭhakura", "viṣṇu"],
    "vowel_length": ["kāla", "nīla", "pūja", "āgama", "māla", "sīmā"],
    "aspiration": ["phala", "bhāva", "khaga", "ghara", "dharma", "thala"],
    "palatal_sibilant": ["śānti", "śabda", "viśva", "āśā", "puruṣa", "śiva"],
    "retroflex_sibilant": ["ṣaṭ", "ṣaḍja", "puruṣa", "viṣṇu", "niṣṭhā"],
    "sibilant_distinction": ["śiva", "ṣaṣṭha", "śānta"],
    "anusvara": ["saṃskṛta", "śaṃkara", "aṃga", "kaṃsa"],
    "visarga": ["namaḥ", "śāntiḥ", "puruṣaḥ", "devāḥ"],
}

MINIMAL_PAIRS = [
    ("nata", "naṭa", "actor vs dancer — dental vs retroflex"),
    ("kala", "kāla", "art vs time — short vs long vowel"),
    ("śiva", "siva", "Shiva vs auspicious — palatal vs dental sibilant"),
    ("phala", "pala", "fruit vs rock — aspirated vs unaspirated"),
    ("dana", "dhana", "gift vs wealth — aspirated vs unaspirated"),
]
