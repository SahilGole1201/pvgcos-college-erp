import re

files = [r"c:\ERP-E_R\frontend\src\App.jsx", r"c:\ERP-E_R\frontend\src\Login.jsx"]

replacements = {
    r"erp-input": "erp-form-control",
    r"erp-btn-primary": "erp-btn--primary",
    r"erp-btn-secondary": "erp-btn--secondary",
    r"erp-btn-outline": "erp-btn--outline",
    r"erp-btn-success": "erp-btn--success",
    r"erp-btn-danger": "erp-btn--danger",
    r"erp-btn-warning": "erp-btn--warning",
    r"erp-btn-info": "erp-btn--primary",
    r"erp-badge-success": "erp-badge--success",
    r"erp-badge-warning": "erp-badge--warning",
    r"erp-badge-danger": "erp-badge--danger",
    r"erp-badge-info": "erp-badge--info"
}

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    for old, new in replacements.items():
        content = re.sub(rf"\b{old}\b", new, content)

    # Clean up inline styles that override theme defaults
    # In Login.jsx, remove inline styling for inputs
    if "Login.jsx" in filepath:
        content = re.sub(r'style={{ width: \'100%\', padding: \'12px 16px\', border: \'1px solid #cbd5e1\', borderRadius: \'8px\', outline: \'none\', boxSizing: \'border-box\' }}', '', content)
        content = re.sub(r'style={{ display: \'block\', marginBottom: \'8px\', fontWeight: \'600\', color: \'#334155\', fontSize: \'14px\' }}', 'className="erp-label"', content)
        content = re.sub(r'style={{ width: \'100%\', padding: \'14px\', fontSize: \'16px\', borderRadius: \'8px\', cursor: isLoading \? \'wait\' : \'pointer\', fontWeight: \'600\' }}', 'style={{ width: \'100%\', cursor: isLoading ? \'wait\' : \'pointer\' }}', content)
        # Fix alert styling
        content = re.sub(r'className="erp-alert-error" style={{.*?}}', 'className="erp-alert erp-alert--danger"', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Replacement complete.")
