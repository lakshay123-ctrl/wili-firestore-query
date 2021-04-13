import React from 'react'
import {Text,View,TouchableOpacity,StyleSheet, TextInput,Image,KeyboardAvoidingView,ToastAndroid} from 'react-native'
import * as Permissions from 'expo-permissions'
import {BarCodeScanner} from 'expo-barcode-scanner'
import * as firebase from 'firebase'
import db from './config'

export default class TranscactionScreen extends React.Component{
    constructor(){
        super();
        this.state = {
            hasCameraPermissions:null,
            scanned:false,
            scannedBookID:'',
            scannedStudentID:'',
            buttonState:'normal',
            transactionMessage:''
        }
    }

    getCameraPermissions = async(ID) => {
     const {status} = await Permissions.askAsync(Permissions.CAMERA)
     this.setState({hasCameraPermissions:status=="granted",buttonState:ID,scanned:false})
     
    }

    handleBarCodeScanned = async ({type,data}) => {
        this.setState({scanned:true,scannedData:data,buttonState:'normal'})
    }


    checkBookEligiblity = async () => {
        const bookRef = await db.collection("books").where("bookID","==",this.state.scannedBookID)
        .get()

        var transactionType = ''
        if (bookRef.docs.length == 0){
            transactionType = false
        }
        else{
            bookRef.docs.map(doc=> {
               var book = doc.data();
               if (book.bookAvailability){
                   transactionType = "Issue"
               }
               else{
                   transactionType = "Return"
               }
            })
        }
        return transactionType
    }


    initiateBookIssue = async () => { 
        db.collection("transaction").add({
            'studentID':this.state.scannedStudentID,
            'bookID':this.state.scannedBookID,
            'data':firebase.firestore.timestamp.now().toDate(),
            'transactionType':"issue"
        })
        db.collection("books").doc(this.state.scannedBookID).update({
            'bookAvailability':false
        })
        db.collection("students").doc(this.state.scannedStudentID).update({
            'numberOfBooksIssued':firebase.firestore.FieldValue.increment(1)
        })
        this.setState({
            scannedStudentID:'',
            scannedBookID:''
        })
    }

    initiateBookReturn = async () => {
        db.collection("transaction").add({
            'studentID':this.state.scannedStudentID,
            'bookID':this.state.scannedBookID,
            'date':firebase.firestore.timestamp.now().toDate(),
            'transactionType':"return"
        })
        db.collection("books").doc(this.state.scannedBookID).update({
            'bookAvailability':true
        })
        db.collection("students").doc(this.state.scannedStudentID).update({
            'numberOfBooksIssued':firebase.firestore.FieldValue.increment(-1)
        })
        this.setState({
            scannedStudentID:'',
            scannedBookID:''
        })
    }


    checkStudentEligibilityForBookIssue = async () => {
        const studentRef = await db
          .collection("students")
          .where("studentId", "==", this.state.scannedStudentID)
          .get();
        var isStudentEligible = "";
        if (studentRef.docs.length == 0) {
          this.setState({
            scannedStudentID: "",
            scannedBookID: ""
          });
          isStudentEligible = false;
          alert("The student id doesn't exist in the database!");
        } else {
          studentRef.docs.map(doc => {
            var student = doc.data();
            if (student.numberOfBooksIssued < 2) {
              isStudentEligible = true;
            } else {
              isStudentEligible = false;
            alert("The student has already issued 2 books!");
              this.setState({
                scannedStudentID: "",
                scannedBookID: ""
              });
            }
          });
        }
    
        return isStudentEligible;
      };

   checkStudentEligiblityForBookReturn = async () => {
    const transactionRef = await db.collection("transaction").where("bookID","==",this.state.scannedBookID)
    .limit(1).get()
    
    var isStudentEligible = ""
    
        transactionRef.docs.map(doc=>{
            var lastBookTransaction = doc.data();
            if (lastBookTransaction.studentID === this.state.scannedStudentID){
                isStudentEligible = true
            }
            else{
                isStudentEligible = false
                alert("the book was not issued by this student")
                this.setState({
                  scannedStudentID:'',
                  scannedBookID:''
              })
            }
        })
    return isStudentEligible
}



    handleTransaction = async () => {
    var transactionType = await this.checkBookEligiblity();
    if (!transactionType){
        alert("this book doesnt in the library database")
        this.setState({scannedStudentID:'',  scannedBookID:''})
    }
    else if (transactionType === "Issue"){
     var isStudentEligible = await this.checkStudentEligiblityForBookIssue();
     if (isStudentEligible){
         this.initiateBookIssue();
         alert("book issued to the student")
     }
    }
    else {
      var isStudentEligible = await this.checkStudentEligiblityForBookReturn();
      if (isStudentEligible){
        this.initiateBookReturn();
        alert("book returned to the library")
    }
    }
    }
    

    render(){
        const hasCameraPermissions = this.state.hasCameraPermissions
        const scanned = this.state.scanned
        const buttonState = this.state.buttonState

    if (buttonState !== "normal"&&hasCameraPermissions){
        return( 
            <BarCodeScanner
            onBarCodeScanned = {scanned?undefined:this.handleBarCodeScanned}
            style = {StyleSheet.absoluteFillObject}
            />
        )
    }


    else if (
        buttonState === "normal"
    ){
        return(
            <KeyboardAvoidingView style = {styles.container}
            behavior = "padding"enabled>
                <View>
                    <Image
                    style = {{width:200,height:200}}
                    source = {require("./assets/booklogo.jpg")}
                    />
                    <Text style = {{textAlign:'center',fontSize:30}}>Wili</Text>
                </View>
                <View style = {styles.inputView}>
                 <TextInput
                 style = {styles.inputBox}
                 placeholder = "Book ID"
                 onChangeText = {text => this.setState({scannedBookID:text})}
                 value = {this.state.scannedBookID}
                />
                
                <TouchableOpacity style = {styles.scanButton}
                onPress={()=>{this.getCameraPermissions("Book ID")}}>
                 <Text style = {styles.buttonText}>
                  Scan
                 </Text>
                </TouchableOpacity>
                </View>
                <View style = {styles.inputView}>
                
                <TextInput  
                
                 style = {styles.inputBox}
                 placeholder = "Student Id"
                 onChangeText = {text => this.setState({scannedStudentID:text})}
                 value = {this.state.scannedStudentID}
                />
                
                <TouchableOpacity style = {styles.scanButton}
                onPress={()=>{this.getCameraPermissions("Student ID")}}>
                 <Text style = {styles.buttonText}>
                  Scan
                 </Text>
                </TouchableOpacity>
                
                

                </View>
                <TouchableOpacity style = {styles.submitButton}
                onPress = {async()=>{this.handleTransaction()
                this.setState({scannedBookID:'',scannedStudentID:''})}}>
                    <Text style = {styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        )
    }
    }
}

const styles = StyleSheet.create({

container:
{
flex:1,
justifyContent:'center',
alignItems:'center'
},

scanButton:
{
    backgroundColor:'yellow',
    padding:5,
    margin:5
},

displayText:
{
fontSize:20
},

buttonText:
{
fontSize:15,
textAlign:'center',
marginTop:10
},

inputBox:
{
width:200,
height:10,
borderWidth:1.5,
borderRightWidth:0,
fontSize:20
},

inputView:
{
flexDirection:'row',
margin:10
},

submitButtonText:
{
    fontSize:20,
    padding:10,
    textAlign:'center',
    fontWeight:'bold',
    color:'white'
},

submitButton:
{
    backgroundColor:'red',
    width:100,
    height:50
}

})