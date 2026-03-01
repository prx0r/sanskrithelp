"""
DHCD class index → Devanagari character mapping.

DHCD: 46 classes = 10 digits (०-९) + 36 consonants (क-ज्ञ).
Order: digits 0-9 first, then consonants in traditional Sanskrit order.
Use explicit list to avoid Unicode conjuncts (क्ष, त्र, ज्ञ) splitting into multiple code points.
"""

# Index 0-9: Devanagari digits
DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"]

# Index 10-45: Consonants (5+5+5+5+5+4+4+3=36)
CONSONANTS = [
    "क", "ख", "ग", "घ", "ङ",
    "च", "छ", "ज", "झ", "ञ",
    "ट", "ठ", "ड", "ढ", "ण",
    "त", "थ", "द", "ध", "न",
    "प", "फ", "ब", "भ", "म",
    "य", "र", "ल", "व",
    "श", "ष", "स", "ह",
    "क्ष", "त्र", "ज्ञ",
]

DHCD_CLASSES = DIGITS + CONSONANTS
assert len(DHCD_CLASSES) == 46, f"Expected 46 classes, got {len(DHCD_CLASSES)}"

# For export to JS: index → character
MAPPING = {i: c for i, c in enumerate(DHCD_CLASSES)}
