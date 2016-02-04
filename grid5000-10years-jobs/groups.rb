require 'json'
require 'time'

sites=%w(nantes rennes lyon nancy sophia reims grenoble lille luxembourg bordeaux orsay toulouse)

sites.each do |site|
  puts "---------------------------"
  puts "GROUPING jobs for #{site}"
  puts "---------------------------"
  file = File.read("jobs_#{site}.json")
  jobs = JSON.parse(file)
  g = jobs.group_by{|j| 
    t = Time.at(j.to_i)
    "#{t.year}-#{t.month}"
  }.map{|k,v| [k,v.size]}.to_h
  File.open("group_jobs_#{site}.json","w") do |f|
    f.write(g.to_json)
  end
end
