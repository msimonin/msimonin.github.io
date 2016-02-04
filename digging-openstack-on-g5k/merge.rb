
require 'json'

sites=%w(nantes rennes lyon nancy sophia reims grenoble lille luxembourg)

allJobs = []
sites.each do |site|
  file = File.read("openstack_#{site}.json")
  data = JSON.parse(file)
  allJobs = allJobs.concat(data)
end

File.open("openstack2.json","w") do |f|
    f.write(allJobs.to_json)
end

