import subprocess

print("Checking out pristine .gitignore")
subprocess.run(['git', 'checkout', 'origin/main', '--', '.gitignore'])

print("Appending to .gitignore")
with open('.gitignore', 'a', encoding='utf-8') as f:
    f.write('\nscratch/\ntest_out/\ntemp.*\ntest.*\nupload_missing.cjs\nscratch_*.cjs\n*.bak\n*.zip\n*.mp3\n*.pdf\n')

print("Soft resetting to origin/main")
subprocess.run(['git', 'reset', '--soft', 'origin/main'])

print("Unstaging everything to apply new gitignore rules")
subprocess.run(['git', 'reset'])

print("Adding all files (respecting new gitignore)")
subprocess.run(['git', 'add', '.'])

print("Committing")
subprocess.run(['git', 'commit', '-m', 'Fix IELTS Mock Test layout, pagination, audio overlaps, and image references'])

print("Commit stats:")
subprocess.run(['git', 'show', '--stat', 'HEAD'])
