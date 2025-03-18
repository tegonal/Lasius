#!/bin/bash

# Generate a json file with all the Terms of Service translations
# from public/locales/<lang>/termsofservice.html

OUTPUTFILE="public/locales/termsofservice.json"
echo "{" > $OUTPUTFILE
FIRST=true
for LOCALESDIR in `find public/locales/ -type d -links 2` ; do
    LANG=`basename $LOCALESDIR`
    INPUTFILE="$LOCALESDIR/termsofservice.html"
    echo "Adding $INPUTFILE to $OUTPUTFILE (language $LANG)"
    HTML=`sed -e 's/\"/\\\"/g' < $INPUTFILE | tr '\n' ' '`
    if [ "$FIRST" = true ] ; then
        FIRST=false
    else
        echo "," >> $OUTPUTFILE
    fi
    echo -n "  \"${LANG}\": \"${HTML}\"" >> $OUTPUTFILE
done
echo "" >> $OUTPUTFILE
echo "}" >> $OUTPUTFILE

