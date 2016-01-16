---
layout: post
title:  "My experimentation notebook (on Grid'5000)"
date:   2016-01-07 10:30:00
categories: jekyll update
---

This articles shows a simple use of [iruby
notebook](https://github.com/SciRuby/iruby) for interacting with Grid'5000
ressources. The experimentation follows three steps :

1. Get some ressources on Grid'5000 
2. Get the uptime of all the nodes of the reservation
3. Draw a bar plot showing the different uptime of the nodes

Check the docker image for a quick try : [Docker image](#installation)

## The notebook

Here is the commented notebook.
Full rendered notebook is also available through [nbviewer service](http://nbviewer.ipython.org/github/msimonin/msimonin.github.io/blob/master/notebooks/g5k-uptime.ipynb)

<!-- rendered using nbviewer -->
<iframe width="100%" height="800px" src="/notebooks/g5k-uptime.html" frameborder="0"></iframe>


## Installation

Here comes the tricky part (no so much actually). My setup was : 

* Ruby 2.1.2
* IPython 4.0.1 with notebook installed
* The Gemfile (```xp5k``` and ```restfully``` need a small patch each):
* and ... an account on Grid'5000.

{% highlight ruby %}
source 'https://rubygems.org'

gem 'restfully',
  :git => 'https://github.com/msimonin/restfully',
  :branch => 'ripl-update'
gem 'xp5k',
  :path => '/Users/msimonin/msimonin@github.com/xp5k',
  :branch => 'dsl_capture'
gem 'rbczmq'
gem 'iruby'
gem 'nyaplot'
{% endhighlight %}

### Docker image

A docker image is available and contains all the dependencies listed above.
Some more configuration is required through the following command :

{% highlight bash %}
docker run --rm -it\
  -p 8888:8888 \                                            # port forwarding between the host and the container
  -v /Users/msimonin/.restfully:/.restfully:ro \            # share restfully configuration
  -v $SSH_AUTH_SOCK:/ssh-agent \                            # share SSH_AUTH_SOCK between the host and the container
  -e SSH_AUTH_SOCK=/ssh-agent \                             # it allows to use the ssh agent of the host
  -e RESTFULLY_CONFIG="/.restfully/api.grid5000.fr.yml" \   # allow restfully to find its connfiguration 
  -e USER=msimonin \                                       # set your g5k user name
  msimonin/g5k-notebook iruby notebook
{% endhighlight %}

If you are a user of ```docker-machine``` on Mac. One preliminary step is required to share the host SSH agent with the container : 

{% highlight bash %}
docker-machine ssh default -A -L 8888:localhost:8888
{% endhighlight %}

### Dockerfile & contributions

see : [https://github.com/msimonin/g5k-notebook](https://github.com/msimonin/g5k-notebook)



