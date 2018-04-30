(ls | egrep '^[0-9]+.*$') | while read f; do rm -rf ${f}; done;
