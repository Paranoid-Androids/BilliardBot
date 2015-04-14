desc "Generate docs"
task :generateDocs do
    jsFiles = Dir["js/billiardbot/**/*"].join(" ")
    system("jsdoc -p -d docs " + jsFiles)
end