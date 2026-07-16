import os
with open('.gitignore', 'a', encoding='utf-8') as f:
    f.write('\nscratch/\ntest_out/\ntemp.*\ntest.*\nupload_missing.cjs\nscratch_*.cjs\n*.bak\n*.zip\n')
