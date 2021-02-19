

GIT_ROOT=`git rev-parse --show-toplevel`

echo "Remember to build soql-parser first with:"
echo "cd $GIT_ROOT/../soql-parser/src/main/javascript"
echo "mvn clean package"
echo ""
echo "Will now copy from $GIT_ROOT/../soql-parser/src/main/javascript/lib to ./soql-parser"
echo "Any key to continue. CTRL-C to abort..."
read IGNORE

mv soql-parser soql-parser.old 
cp -r $GIT_ROOT/../soql-parser/src/main/javascript/lib ./soql-parser
echo 'This directory is a copy of the `lib/` output folder of the (private) @salesforce/soql-parser package' >> soql-parser/README.txt



