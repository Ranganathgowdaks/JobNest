const express=require("express");
const app=express()
app.listen(800,req,res=>{
    console.log("")
})
app.get("/query",async (req,res)=>{
    const query ={age:{$time:2}}
    const  options={
        sort:{time:1}
    }
    const result =collection.find(query,options)
})