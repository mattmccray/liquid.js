#!/usr/bin/env ruby

require 'listen'

listener = Listen.to( 'source' ) do |modified, added, removed|
  puts 'Running builder...'
  system( 'bundle exec rake' )
end
listener.start
sleep
