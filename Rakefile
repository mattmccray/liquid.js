
desc "Test javascript in Adobe AIR... Required AIR SDK"
task :test_air do
  puts `adl test-app.xml`
end


desc "Test javascript in Rhino... Requires Java"
task :test do
  # Yeah, doesn't really work right yet
  puts "Not working yet. But you can open test/liquid-tests.html in your browser..."
  puts `java -jar test/env/js.jar test/env/test.harness.js`
end



desc "Compiles from source scripts into dist/liquid.js"
task :build do
  puts "Building liquid.js..."
  begin
    require 'sprockets'
  rescue
    puts "Build require sprockets:"
    puts
    puts "  gem install sprockets"
    puts
    exit(1)
  end
  
  secretary = Sprockets::Secretary.new(
    :asset_root   => "assets",
    :load_path    => ["source", "etc", "."],
    :source_files => ["source/core.js"]
  )

  # Generate a Sprockets::Concatenation object from the source files
  concatenation = secretary.concatenation
  # Write the concatenation to disk
  concatenation.save_to("dist/liquid.js")
  
  puts "Piping liquid.js through jsmin..."
  `cat dist/liquid.js | jsmin > dist/liquid.min.js`

  puts "Piping liquid.js through yuicompressor..."
  `java -jar $HOME/Dev/bin/yuicompressor-2.3.5.jar -o dist/liquid.ymin.js dist/liquid.js`
  
  puts 'Done.'
end
