
desc "Test javascript in Adobe AIR... Required AIR SDK"
task :test_air do
  puts `adl test-app.xml`
end


desc "Test javascript in Rhino... Requires Java"
task :test do
  # Yeah, doesn't really work right yet
  #puts `java -jar test/env/js.jar test/env/test.harness.js`
  puts "Not working yet. But you can open test/liquid-tests.html in your browser..."
end


desc "Compiles from source scripts into dist/liquid.js"
task :build do
  source = {}
  %w(api block condition context default_filters default_tags document drop strainer strftime tag template variable).each do |src|
    source[ src.to_sym ] = IO.readlines("source/#{ src }.js")
  end
  license = {}
  %w(liquid strftime readme).each do |src|
    license[ src.to_sym ] = IO.readlines("licenses/#{ src }.txt")
  end
  template =<<-EOS
#{ license[:liquid] }
#{ license[:readme] }
var Liquid = (function(){
  // tag.js
  #{ source[:tag] }
  // block.js
  #{ source[:block] }
  // document.js  
  #{ source[:document] }
  // strainer.js
  #{ source[:strainer] }
  // context.js  
  #{ source[:context] }
  // template.js
  #{ source[:template] }
  // variable.js
  #{ source[:variable] }
  // condition.js
  #{ source[:condition] }
  // drop.js
  #{ source[:drop] }
  // default_tags.js
  #{ source[:default_tags] }
  // default_filters.js
  #{ source[:default_filters] }
  // api.js
  #{ source[:api] }
})();

// strftime.js
#{ license[:strftime] }
#{ source[:strftime] }
EOS
  File.open("dist/liquid.js", 'w') do |f|
    f.write template
  end
  
  puts "Piping liquid.js through jsmin..."
  `cat dist/liquid.js | jsmin > dist/liquid.min.js`
  
  puts "Done."
end