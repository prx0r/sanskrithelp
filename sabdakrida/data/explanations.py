"""
Error explanations — Sanskrit + English corrective feedback for the teacher voice.
"""

ERROR_EXPLANATIONS = {
    "retroflex_dental": {
        "sanskrit": "jihvā mūrdhni na sthitā. uccasthāne spṛśatu.",
        "english": "Tongue not at hard palate. Touch the upper position.",
        "tip": "Curl tongue back — tip touches the ridge behind the teeth.",
        "tone": "command",
    },
    "aspiration": {
        "sanskrit": "śvāsaḥ nāsti. vāyu sahitam uccāraya.",
        "english": "No breath. Pronounce with air.",
        "tip": "Hold hand in front of mouth — aspirated sounds need a puff.",
        "tone": "command",
    },
    "vowel_length": {
        "sanskrit": "dīrgha svaro hrasvaḥ jātaḥ. dviguṇakālaṃ tiṣṭhatu.",
        "english": "Long vowel became short. Hold it twice as long.",
        "tip": "Count: ā is exactly 2× the duration of a.",
        "tone": "command",
    },
    "palatal_sibilant": {
        "sanskrit": "tālavya śaḥ nāsti. jihvā tāluni sthāpaya.",
        "english": "Palatal sibilant missing. Place tongue at palate.",
        "tip": "ś is like the 'sh' in 'she' — tongue at roof of mouth.",
        "tone": "command",
    },
    "retroflex_sibilant": {
        "sanskrit": "mūrdhanya ṣaḥ nāsti. jihvā mūrdhni sthāpaya.",
        "english": "Retroflex sibilant missing. Tongue at hard palate.",
        "tip": "ṣ: tongue curled back to palate, then push air.",
        "tone": "command",
    },
    "sibilant_distinction": {
        "sanskrit": "ś-ṣayor bhedaḥ āvaśyakaḥ.",
        "english": "The ś / ṣ distinction is required.",
        "tip": "ś = tongue at palate tip. ṣ = tongue curled further back.",
        "tone": "command",
    },
    "anusvara": {
        "sanskrit": "anunāsikaṃ nāsti. nāsikayā uccāraya.",
        "english": "Nasalisation missing. Produce through nose.",
        "tip": "ṃ resonates in the nasal cavity — hum it.",
        "tone": "command",
    },
    "visarga": {
        "sanskrit": "visargaḥ nāsti. avasāne śvāsaḥ āvaśyakaḥ.",
        "english": "Visarga missing. A breath at the end is required.",
        "tip": "ḥ: after the vowel, exhale briefly at its mouth position.",
        "tone": "command",
    },
}
