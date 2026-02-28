"""
Phoneme confusion map — core knowledge base for Sanskrit pronunciation diagnosis.
When Whisper transcribes ṭīkā as tīkā, that IS the pronunciation error.
"""

PHONEME_CONFUSIONS = {
    # Retroflex vs dental (most common errors for Western learners)
    ("ṭ", "t"): "retroflex_dental",
    ("ḍ", "d"): "retroflex_dental",
    ("ṇ", "n"): "retroflex_dental",
    ("ṭh", "th"): "retroflex_dental",
    ("ḍh", "dh"): "retroflex_dental",
    ("t", "ṭ"): "retroflex_dental",
    ("d", "ṭ"): "retroflex_dental",
    ("d", "t"): "retroflex_dental",
    ("t", "d"): "retroflex_dental",

    # Aspiration (missing puff of air)
    ("th", "t"): "aspiration",
    ("kh", "k"): "aspiration",
    ("ph", "p"): "aspiration",
    ("bh", "b"): "aspiration",
    ("gh", "g"): "aspiration",
    ("ch", "c"): "aspiration",
    ("dh", "d"): "aspiration",
    ("dh", "t"): "aspiration",

    # Vowel length (duration errors — ā is TWICE as long as a)
    ("ā", "a"): "vowel_length",
    ("ī", "i"): "vowel_length",
    ("ū", "u"): "vowel_length",
    ("a", "ā"): "vowel_length",
    ("i", "ī"): "vowel_length",
    ("u", "ū"): "vowel_length",

    # Sibilant distinctions (three kinds of 's')
    ("ś", "s"): "palatal_sibilant",
    ("ṣ", "s"): "retroflex_sibilant",
    ("ṣ", "ś"): "sibilant_distinction",

    # Special characters
    ("ṃ", "m"): "anusvara",
    ("ḥ", "h"): "visarga",
}
