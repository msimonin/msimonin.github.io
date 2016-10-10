---
layout: post
title:  "Vagrant-g5k goes parallel"
date:   2016-10-10 6:30:00
categories:
---

# Vagrant-g5k goes parallel

Version [0.0.15](https://github.com/msimonin/vagrant-g5k/tree/0.0.15) introduces the ability to boot VMs in parallel. Let's have an example

## Vagrantfile

The following Vagrantfile starts one VM per site.

{% highlight ruby %}
SITES=['rennes', 'nancy', 'nantes', 'lille', 'luxembourg', 'grenoble', 'lyon']

Vagrant.configure(2) do |config|
    SITES.each do |site|
      config.vm.define "vm-#{site}" do |my|
        my.vm.box = "dummy"

        my.ssh.username = "root"
        my.ssh.password = ""

        my.vm.provider "g5k" do |g5k|
          g5k.project_id = "vagrant-g5k"
          g5k.site = "#{site}"
          g5k.gateway = "access.grid5000.fr"
          g5k.image = {
             "pool"     => "msimonin_rbds",
             "rbd"      => "bases/alpine_docker",
             "snapshot" => "parent",
             "id"       => "$USER",
             "conf"     => "$HOME/.ceph/config",
             "backing"  => "snapshot"
           }
          g5k.ports = ['2222-:22']
          g5k.oar = "virtual != 'none'"
        end #g5k
      end #vm
    end # each

end
{% endhighlight %}

## Output

The output shows that the different boot sequences are interleaved.

**It took 10s to have all the VMs running**.

{% highlight shell %}
Bringing machine 'vm-rennes' up with 'g5k' provider...
Bringing machine 'vm-nancy' up with 'g5k' provider...
Bringing machine 'vm-nantes' up with 'g5k' provider...
Bringing machine 'vm-lille' up with 'g5k' provider...
Bringing machine 'vm-luxembourg' up with 'g5k' provider...
Bringing machine 'vm-grenoble' up with 'g5k' provider...
Bringing machine 'vm-lyon' up with 'g5k' provider...
==> vm-nantes: Launching the VM on nantes
==> vm-lyon: Launching the VM on lyon
==> vm-rennes: Launching the VM on rennes
==> vm-grenoble: Launching the VM on grenoble
==> vm-luxembourg: Launching the VM on luxembourg
==> vm-nancy: Launching the VM on nancy
==> vm-lille: Launching the VM on lille
==> vm-nantes: Waiting for the job to be running
==> vm-grenoble: Waiting for the job to be running
==> vm-luxembourg: Waiting for the job to be running
==> vm-nancy: Waiting for the job to be running
==> vm-lyon: Waiting for the job to be running
==> vm-rennes: Waiting for the job to be running
==> vm-nantes: Waiting for the job to be running
==> vm-lille: Waiting for the job to be running
==> vm-grenoble: Waiting for the job to be running
==> vm-nancy: Waiting for the job to be running
==> vm-luxembourg: Waiting for the job to be running
==> vm-rennes: Waiting for the job to be running
==> vm-lyon: Waiting for the job to be running
==> vm-nantes: booted @nantes on econome-8.nantes.grid5000.fr
==> vm-grenoble: booted @grenoble on genepi-33.grenoble.grid5000.fr
==> vm-nancy: Waiting for the job to be running
==> vm-luxembourg: booted @luxembourg on petitprince-9.luxembourg.grid5000.fr
==> vm-lille: Waiting for the job to be running
==> vm-rennes: Waiting for the job to be running
==> vm-lyon: booted @lyon on taurus-4.lyon.grid5000.fr
==> vm-nancy: Waiting for the job to be running
==> vm-lille: booted @lille on chimint-7.lille.grid5000.fr
==> vm-rennes: Waiting for the job to be running
==> vm-nancy: Waiting for the job to be running
==> vm-rennes: booted @rennes on parapluie-8.rennes.grid5000.fr
==> vm-nancy: Waiting for the job to be running
==> vm-nancy: Waiting for the job to be running
==> vm-nancy: booted @nancy on griffon-9.nancy.grid5000.fr
{% endhighlight %}
