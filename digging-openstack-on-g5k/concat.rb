require 'json'

# merge with toulouse jobs
file = File.read("openstack.json")
data = JSON.parse(file)
toulouse = data.select{|d| d["site"] == "toulouse"}

file2 = File.read("openstack2.json")
data2 = JSON.parse(file)

data2.concat(toulouse)
File.open("openstack_new.json", "w") do |f|
  f.write(data2.to_json)
end

