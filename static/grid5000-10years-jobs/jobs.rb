#!/usr/bin/env ruby

require 'pg'
require 'restfully'
require 'json'

sites=%w(nantes rennes lyon nancy sophia reims grenoble lille luxembourg)

jobs = Hash.new{|h,k| h[k] = []}
sites.each do |site| 
  puts "---------------------------"
  puts "FETCHING jobs for #{site}"
  puts "---------------------------"
  conn = PG::Connection.open(
    :host     => "oardb.#{site}.grid5000.fr",
    :user     => 'oarreader',
      :password => 'read',
      :dbname   => 'oar2')
  offset = 0
  limit = 2000
  res = conn.exec("select * from jobs where start_time != '0' and stop_time != '0' order by start_time limit #{limit} offset #{offset}")
  while res.count > 0 
    res.each do |r|
      jobs[site] << r["start_time"]
    end
    puts "got #{jobs[site].size} jobs so far"
    offset += limit
    res = conn.exec("select * from jobs where start_time != '0' and stop_time != '0' order by start_time limit #{limit} offset #{offset}")
  end
  File.open("jobs_#{site}.json","w") do |f|
    f.write(jobs[site].to_json)
  end
end



