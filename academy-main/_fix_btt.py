css = """
/* Move back-to-top above the floating chat FAB */
.back-to-top { bottom: 5.2rem; right: 1.5rem; }
"""
with open('styles.css', 'a', encoding='utf-8') as f:
    f.write(css)
print('Done.')
