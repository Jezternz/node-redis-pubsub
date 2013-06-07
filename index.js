/*
    Redis Pub Sub Client plugin
    * Only requires 2x redis connections
    * Provides any number of private & public channels for unlimited clients
*/
module.exports = new function()
{

    var 
        len,indx,tarr;
    var
        dbsub = false,
        dbpub = false,
        rPubSubIdCounter = 1,
        clientLookup = {},
        globalSubscriptions = {};

    // public
    this.init = function(tdbsub, tdbpub)
    {
        dbsub = tdbsub;
        dbpub = tdbpub;
        dbsub.on("message", incommingMessage);
    }
    this.createClient = function()
    {
        return new RPubSupClient();
    }
    
    // private
    var incommingMessage = function(rawchannel, strMessage)
    {
        len = globalSubscriptions[rawchannel].length;
        for(var i=0;i<len;i++)
        {
            //console.log(globalSubscriptions[rawchannel][i]+' incomming on channel '+rawchannel);
            clientLookup[globalSubscriptions[rawchannel][i]]._incommingMessage(rawchannel, strMessage);
        }
    }
    
    // class
    var RPubSupClient = function()
    {
        var 
            id = -1,
            localSubscriptions = [];
        
        this.id = -1;
        this._incommingMessage = function(){};
        
        this.subscribe = function(channel)
        {
            //console.log('client '+id+' subscribing to '+channel);
            if(!(channel in globalSubscriptions))
            {
                globalSubscriptions[channel] = [id];
                dbsub.subscribe(channel);
            }
            else if(globalSubscriptions[channel].indexOf(id) == -1){
                globalSubscriptions[channel].push(id);
            }
            if(localSubscriptions.indexOf(channel) == -1){
                localSubscriptions.push(channel);
            }
        }
        this.unsubscribe = function(channel)
        {
            //console.log('client '+id+' unsubscribing to '+channel);
            if(channel in globalSubscriptions)
            {
                indx = globalSubscriptions[channel].indexOf(id);
                if(indx != -1){
                    globalSubscriptions[channel].splice(indx, 1);
                    if(globalSubscriptions[channel].length == 0){
                        delete globalSubscriptions[channel];
                        dbsub.unsubscribe(channel);
                    }
                }
            }
            indx = localSubscriptions.indexOf(channel);
            if(indx != -1){
                localSubscriptions.splice(indx, 1);
            }
        }
        this.onMessage = function(msgFn)
        {
            this._incommingMessage = msgFn;
        }
        this.publish = function(channel, data)
        {
            dbpub.publish(channel, data);
            return this;
        }
        this.end = function()
        {
            //console.log('end client id = '+id+' closing subscriptions='+localSubscriptions.join(','));
            tarr = localSubscriptions.slice(0);
            len = tarr.length;
            for(var i=0;i<len;i++){
                this.unsubscribe(tarr[i]);
            }
            localSubscriptions = [];
            delete clientLookup[id];
        }        
        var constructor = function()
        {
            this.id = id = rPubSubIdCounter++;
            clientLookup[id] = this;
            //console.log('new client id = '+id);
        }        
        constructor.apply(this, arguments);
    } 
};