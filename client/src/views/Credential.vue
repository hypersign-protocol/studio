<style scoped>
.addmargin {
  margin-top: 10px;
  margin-bottom: 10px;
}

.vue-logo-back {
  background-color: black;
}

.logo {
  width: 144px;
}

.fullbody {
  width: 100%;
}

.floatLeft {
  float: left;
}
.floatRight {
  float: right;
}

.card-header {
  background: aliceblue;
  padding: 0px;
}

.card{
  border-radius: 10px;
}

</style>
<template>
  <div class="home marginLeft marginRight">
    <loading :active.sync="isLoading" 
        :can-cancel="true"        
        :is-full-page="fullPage"></loading>

    <div class="row">
      <div class="col-md-12" style="text-align: left">
        <Info :message="description"/>
        <div class="card">
          <div class="card-header">
            <b-button v-b-toggle.collapse-1 variant="link">Issue Credential</b-button>
          </div>
          <b-collapse id="collapse-1" class="mt-2">
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <form style="max-height:300px; overflow:auto; padding: 5px">
                    <div class="form-group">
                      <input type="text" class="form-control" placeholder="Issued To (did:hs:...)" v-model="holderDid"/>
                    </div>
                    <div class="form-group">
                      <b-form-select
                        v-model="selected"
                        :options="selectOptions"
                        @change="OnSchemaSelectDropDownChange($event)"
                        size="md"
                        class="mt-3"
                      ></b-form-select>
                    </div>
                    <div class="form-group" v-for="attr in issueCredAttributes" :key="attr.name">
                      <label>{{attr.name}}</label>
                      <input
                        text
                        v-model="attr.value"
                        class="form-control"
                        placeholder="Enter attribute value"
                      />
                    </div>
                  </form>
                  <hr />
                  <button class="btn btn-outline-primary btn-sm" @click="issueCredential()">Issue</button>
                </div>
                <div class="col-md-6" style="padding: 30px" v-if="isCredentialIssued">
                  <div class="form-group" style="text-align:center">
                    <qrcode-vue :value="signedVerifiableCredential" :size="200" level="H"></qrcode-vue>
                    <label class="title">Scan the QR code using Hypersign Wallet!</label>
                  </div>
                  <div class="form-group" style="text-align:center">
                    <p></p>
                    <h5>OR</h5>
                    <button class="btn btn-link" @click="downloadCredentials()">Download Credential</button>
                  </div>
                </div>
              </div>
            </div>
          </b-collapse>
        </div>
      </div>
    </div>
    <div class="row" style="margin-top: 2%;">
      <div class="col-md-12">
        <table class="table table-bordered" style="background:#FFFF">
          <thead class="thead-light">
            <tr>
              <th>id</th>
              <th>schemaId</th>
              <th>issuer</th>
              <th>subject</th>
              <th>dataHash</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in vcList" :key="row">
              <th scope="row">
                <div class="custom-control custom-checkbox">
                  <input type="checkbox" class="custom-control-input" :id="row.id" />
                  <label class="custom-control-label" :for="row.id">{{row.id}}</label>
                </div>
              </th>
              <td>{{row.schemaId}}</td>
              <td>{{row.issuer}}</td>
              <td>{{row.subject}}</td>
              <td>{{row.dataHash}}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import fetch from "node-fetch";
import conf from '../config';
const { hypersignSDK } = conf;
import QrcodeVue from "qrcode.vue";
import Info from '@/components/Info.vue'
export default {
  name: "IssueCredential",
  components: { QrcodeVue, Info },
  data() {
    return {
      description: "An issuer can issue a credential to a subject (or holder) which can be verfied by the verifier independently, without having him to connect with the issuer. They are a part of our daily lives; driver's licenses are used to assert that we are capable of operating a motor vehicle, university degrees can be used to assert our level of education, and government-issued passports enable us to travel between countries.  For example: an airline company can issue a flight ticket (\"verfiable credential\") using schema (issued by DGCA) to the passenger.",
      active: 0,
      host: location.hostname,
      user: {},
      prevRoute: null,
      attributeName: "",
      attributes: [],
      issueCredAttributes: [],
      radioSelected: "create",
      credentialName: "",
      isCredentialIssued: false,
      signedVerifiableCredential: "",
      credentials: JSON.parse(localStorage.getItem("credentials")),
      subjectDid: "did:hs:AmitKumar",
      radioOptions: [
        { text: "Create new schema", value: "create" },
        { text: "Select existing schema", value: "existing" },
      ],
      selected: null,
      attributeValues: {},
      authToken: localStorage.getItem("authToken"),
      selectOptions: [{ value: null, text: "Please select a schema" }],
      schemaMap: {},
      vcList : [],
      schemaList: [],
      fullPage: true,
      isLoading: false,
      holderDid: ""
    };
  },
  created() {
    const usrStr = localStorage.getItem("user");
    this.user = JSON.parse(usrStr);
    //console.log(this.user)
    this.getList('SCHEMA')
    this.getList('CREDENTIAL')
  },
  beforeRouteEnter(to, from, next) {
    next((vm) => {
      vm.prevRoute = from;
    });
  },
  methods: {
    notifySuccess(msg){
      this.$notify({
          group: 'foo',
          title: 'Information',
          type: 'success',
          text: msg
        });
    },
    notifyErr(msg){
      this.$notify({
          group: 'foo',
          title: 'Error',
          type: 'error',
          text: msg
        });
    },
    async getList(type) {
      let url = "";
      let options = {}
      if(type === "SCHEMA"){
        url = `${this.$config.nodeServer.BASE_URL}${this.$config.nodeServer.SCHEMA_LIST_EP}`;
        options  = {
          method: "GET"
        }
      }else{
        url = `${this.$config.studioServer.BASE_URL}${this.$config.studioServer.CRED_LIST_EP}`;
        options  = {
          method: "GET",
          headers: {'x-auth-token': this.authToken}
        }
      }
      
      const resp = await fetch(url, options);
      const j = await resp.json();
      if (j && j.status == 500) {
        return this.notifyErr(`Error:  ${j.error}`);
      }
      if(type === "SCHEMA"){
        const schemaList = j.message
        if(schemaList && schemaList.length > 0){
          schemaList.forEach(s => {
            if(s.owner != this.user.id) return
            this.schemaMap[s.id] = JSON.parse(s.attributes)
            this.selectOptions.push({
              value: s.id,
              text: `${s.credentialName} | ${s.id}`
            })
          });
        }
      }else{
        this.vcList = j.message.list;
      }
    },
    fetchData(url, option) {
      fetch(url)
        .then((res) => res.json())
        .then((j) => {
          if (j.status != 200) throw new Error(j.error);
          return j.message;
        })
        .catch((e) => this.notifyErr(`Error: ${e.message}`));
    },
    gotosubpage: (id) => {
      this.$router.push(`${id}`);
    },
    addBlankAttrBox() {
      if (this.attributeName != " ") {
        this.attributes.push(this.attributeName);
        this.attributeName = " ";
      }
    },
    onSchemaOptionChange(event) {
      //console.log(event);
      this.attributes = [];
      this.issueCredAttributes = [];
      this.selected = null;
      this.credentialName = "";
    },
    OnSchemaSelectDropDownChange(event) {
      //console.log(event);
      if (event) {
        this.issueCredAttributes = [];
        const id = this.issueCredAttributes.length;
        this.schemaMap[event].forEach((e) => {
          this.issueCredAttributes.push({
            id: id + event,
            type: "text",
            name: e,
            value: "",
          });
        });
      } else {
        this.issueCredAttributes = [];
      }
    },
    forceFileDownload(data, fileName) {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
    },
    downloadCredentials() {
      this.forceFileDownload(
        JSON.stringify(this.signedVerifiableCredential),
        "vc.json"
      );
    },
    generateAttributeMap() {
      let attributesMap = [];
      if (this.issueCredAttributes.length > 0) {
        this.issueCredAttributes.forEach((e) => {
          attributesMap[e.name] = e.value;
        });
      }
      return attributesMap;
    },

    getCredentials(attributesMap) {
      const schemaUrl = `${this.$config.nodeServer.BASE_URL}${this.$config.nodeServer.SCHEMA_GET_EP}/${this.selected}`;
      return hypersignSDK.credential.generateCredential(schemaUrl, {
        subjectDid: this.holderDid,
        issuerDid: this.user.publicKey,
        expirationDate: new Date().toISOString(),
        attributesMap,
      }).then((signedCred) => {
        return signedCred;
      });
    },

    signCredentials(credential) {
      return hypersignSDK.credential.signCredential(credential, this.user.publicKey, this.user.privateKey).then(
        (signedCredential) => {
          return signedCredential;
        }
      );
    },
    async issueCredential() { 
      try{
        this.isLoading = true
        if(this.holderDid == "") throw new Error("Please enter the holder did")
        if(this.selected == null) throw new Error("Please select a schema")

      // generateAttributeMap
      const attributeMap = await this.generateAttributeMap();

      const verifiableCredential = await this.getCredentials(attributeMap);
      // signCredentials
      const signedVerifiableCredential = await this.signCredentials(
        verifiableCredential
      );
      this.signedVerifiableCredential = signedVerifiableCredential;

      const url = `${this.$config.studioServer.BASE_URL}${this.$config.studioServer.CRED_ISSUE_EP}`;
      const headers = {
        "Content-Type": "application/json",
        "x-auth-token": this.authToken,
      };
      const body = {
        subject: this.subjectDid,
        schemaId: this.selected,
        dataHash: signedVerifiableCredential,
        appId: "appI123",
      };

      fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      })
        .then((res) => res.json())
        .then((j) => {
          if (j.status != 200) throw new Error(`Error: ${j.error}`);
          if (j.status === 200) {
            this.isCredentialIssued = true;
            this.onSchemaOptionChange(null);
            this.vcList.push({
              ...j.message
            })
            this.isLoading = false
            this.notifySuccess("Credential successfully issued")
          }
        })
        .catch((e) => {
          this.isLoading = false
          this.notifyErr(`Error: ${e.message}`)
        });
      } catch(e){
        this.isLoading = false
        this.notifyErr(`Error: ${e.message}`)
      }
    },
  },
};
</script>


