#! /bin/bash

echo 'npm run preCommit &> /dev/null' > .git/hooks/pre-commit
echo 'exit $?' >> .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
