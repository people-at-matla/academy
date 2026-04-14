css = """
/* Live Support chat — online indicator dot in header */
.fch-online-dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    background: #10b981;
    border-radius: 50%;
    margin-right: 3px;
    animation: fchPulse 2s infinite;
    vertical-align: middle;
}
"""
with open('styles.css', 'a', encoding='utf-8') as f:
    f.write(css)
print('Done.')
