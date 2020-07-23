#! /bin/bash

rm data/express.db 2> /dev/null
cat setup/sql/express_schema.sql setup/sql/data_insertion.sql | sqlite3 data/express.db
