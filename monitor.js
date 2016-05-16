#!/usr/bin/env node

var dotenv = require('dotenv');
var mongoose = require('mongoose');
var amqp = require('amqplib/callback_api');
var RedisSMQ = require("rsmq");

var monitor = require('controllers/monitorController');


dotenv.load();

mongoose.connect(process.env.DB_CONNECTION);

var rsmq = new RedisSMQ( {host: process.env.RABBITMQ_SERVER, port: process.env.RABBITMQ_PORT, ns: "rsmq"} );
var queue = process.env.RABBITMQ_QUEUE;

rsmq.createQueue({qname: queue}, function (err, resp) {
  if (resp===1) {
    console.log("RSMQ: queue created")
  }
});

setInterval(function() { 
  rsmq.receiveMessage({qname: queue}, function (err, resp) {
    if (resp.id) {
      console.log("RSMQ: Message received.", resp);
      var data = JSON.parse(resp);
      monitor.processTask(data);
    }
    else {
      //console.log("RSMQ: No messages for me...")
    }
  });
}, 100);
