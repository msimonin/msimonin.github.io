require 'json'

# merge with toulouse jobs
file = File.read("openstack_toulouse.json")
data = JSON.parse(file)

# this file mustn't contain any toulouse deployment
file2 = File.read("openstack.json")
data2 = JSON.parse(file2)

puts data2.size
data2.concat(data)
puts data2.size
File.open("openstack_new.json", "w") do |f|
  f.write(data2.to_json)
end

