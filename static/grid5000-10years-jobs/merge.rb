require 'json'
require 'time'

sites=%w(nantes rennes lyon nancy sophia reims grenoble lille luxembourg bordeaux orsay toulouse)

a = []
sites.each do |site|
  puts "---------------------------"
  puts " MERGING groups for #{site}"
  puts "---------------------------"
  file = File.read("group_jobs_#{site}.json")
  g = JSON.parse(file)
  a = a.concat(
    g.map{|k,v| 
      date = k.split('-')
      date[1] = "0#{date[1]}" if date[1].size < 2
      {month: date.join("-"), jobs: v, site: site.capitalize}}
     .select{|x| x[:month] >= "2005-01" and x[:month] <= "2016-02"}
  )
  a.sort!{|x,y| x[:month] <=> y[:month]} 
end

File.open("monthly_jobs.json","w") do |f|
  f.write(a.to_json)
end

