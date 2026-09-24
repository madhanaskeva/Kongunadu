// Shared mock data for the Transport Management System (Phase 1).
const branches=[
 {id:'B01',code:'CHN',name:'Chennai HO',state:'Tamil Nadu',vehicles:212,supervisors:9,status:'Active'},
 {id:'B02',code:'NMK',name:'Namakkal',state:'Tamil Nadu',vehicles:168,supervisors:7,status:'Active'},
 {id:'B03',code:'HYD',name:'Hyderabad',state:'Telangana',vehicles:124,supervisors:5,status:'Active'},
 {id:'B04',code:'BLR',name:'Bengaluru',state:'Karnataka',vehicles:96,supervisors:4,status:'Active'},
 {id:'B05',code:'MUM',name:'Mumbai',state:'Maharashtra',vehicles:84,supervisors:4,status:'Active'},
 {id:'B06',code:'VZG',name:'Visakhapatnam',state:'Andhra Pradesh',vehicles:38,supervisors:2,status:'Inactive'}
];
const supervisors=[
 {id:'S01',name:'R. Senthil Kumar',email:'supervisor@transport.example',phone:'98410 22314',branch:'B01',clients:'INOX Air Products, Linde India',clientIds:['C01','C02'],status:'Active',lastLogin:'Today 06:12'},
 {id:'S02',name:'M. Arunachalam',phone:'98430 11908',branch:'B02',clients:'Air Liquide India',clientIds:['C03'],status:'Active',lastLogin:'Today 05:48'},
 {id:'S03',name:'K. Vijayalakshmi',phone:'99400 87621',branch:'B01',clients:'Linde India, Suguna Foods',clientIds:['C02','C05'],status:'Active',lastLogin:'Yesterday 21:30'},
 {id:'S04',name:'P. Ramesh Babu',phone:'90000 45512',branch:'B03',clients:'Bharat Petroleum',clientIds:['C04'],status:'Active',lastLogin:'Today 07:02'},
 {id:'S05',name:'S. Nagaraj',phone:'98860 32217',branch:'B04',clients:'Hindustan Petroleum',clientIds:['C06'],status:'Suspended',lastLogin:'12 Aug 2026'},
 {id:'S06',name:'A. Deshmukh',phone:'98200 65430',branch:'B05',clients:'INOX Air Products',clientIds:['C01'],status:'Active',lastLogin:'Today 06:40'}
];
const vehicles=[
 {id:'V01',number:'TN 28 AQ 4521',type:'Reefer container 20ft',branch:'B01',clients:['C01','C02'],driver:'D01',tank:300,odometer:125450,status:'Running',gps:'OK',lastSeen:'2 min ago',route:'Sriperumbudur \u2192 Hyderabad'},
 {id:'V02',number:'TN 28 BC 1180',type:'Reefer trailer 32ft',branch:'B01',clients:['C01','C02','C05'],driver:'D02',tank:400,odometer:98210,status:'Idle',gps:'OK',lastSeen:'6 min ago',route:'Parked at Sriperumbudur hub'},
 {id:'V03',number:'TN 34 CV 0921',type:'Reefer container 20ft',branch:'B02',clients:['C03'],driver:'D03',tank:300,odometer:210330,status:'Running',gps:'Weak',lastSeen:'18 min ago',route:'Namakkal \u2192 Bengaluru'},
 {id:'V04',number:'TN 28 AR 7712',type:'Closed body 19ft',branch:'B01',clients:['C02','C05'],driver:null,tank:200,odometer:66120,status:'Idle',gps:'OK',lastSeen:'1 min ago',route:'Parked at Ambattur yard'},
 {id:'V05',number:'TS 09 UB 3344',type:'Reefer container 20ft',branch:'B03',clients:['C04'],driver:'D05',tank:300,odometer:154880,status:'Running',gps:'Failed',lastSeen:'2 h 14 min ago',route:'Hyderabad \u2192 Mumbai'},
 {id:'V06',number:'TN 34 CQ 5566',type:'Reefer trailer 32ft',branch:'B02',clients:['C03'],driver:'D04',tank:400,odometer:187002,status:'Maintenance',gps:'OK',lastSeen:'40 min ago',route:'Service bay, Namakkal'},
 {id:'V07',number:'KA 01 AJ 9087',type:'Closed body 24ft',branch:'B04',clients:['C06'],driver:'D06',tank:250,odometer:44510,status:'Running',gps:'OK',lastSeen:'1 min ago',route:'Bengaluru \u2192 Chennai'},
 {id:'V08',number:'TN 28 BD 2209',type:'Reefer container 20ft',branch:'B01',clients:['C01','C02'],driver:'D07',tank:300,odometer:132760,status:'Idle',gps:'OK',lastSeen:'3 min ago',route:'Parked at Sriperumbudur hub'},
 {id:'V09',number:'MH 04 GH 6612',type:'Reefer trailer 32ft',branch:'B05',clients:['C01'],driver:'D08',tank:400,odometer:201115,status:'Running',gps:'OK',lastSeen:'just now',route:'Mumbai \u2192 Pune'},
 {id:'V10',number:'TN 28 AQ 8890',type:'Closed body 19ft',branch:'B01',clients:['C02','C05'],driver:'D09',tank:200,odometer:75300,status:'Idle',gps:'OK',lastSeen:'9 min ago',route:'Parked at Ambattur yard'},
 {id:'V11',number:'TN 28 CK 3310',type:'Reefer container 20ft',branch:'B01',clients:['C01','C02'],driver:'D12',tank:300,odometer:88420,status:'Running',gps:'OK',lastSeen:'1 min ago',route:'Loading at Sriperumbudur hub'},
 {id:'V12',number:'TN 28 CM 6645',type:'Reefer trailer 32ft',branch:'B01',clients:['C01','C02'],driver:'D13',tank:400,odometer:143905,status:'Running',gps:'OK',lastSeen:'4 min ago',route:'Unloading at Apollo Hospitals, Chennai'},
 {id:'V13',number:'TN 28 BZ 1902',type:'Closed body 19ft',branch:'B01',clients:['C02','C05'],driver:'D14',tank:200,odometer:59870,status:'Running',gps:'OK',lastSeen:'7 min ago',route:'Ambattur \u2192 Vijayawada'}
];
const drivers=[
 {id:'D01',name:'Murugan S.',licence:'TN2820190004521',phone:'90031 22110',branch:'B01',type:'Regular',status:'Active',approval:'Approved',present:24,absent:2,util:'88%'},
 {id:'D02',name:'Karthik R.',licence:'TN2820170001180',phone:'90031 88221',branch:'B01',type:'Regular',status:'Active',approval:'Approved',present:22,absent:4,util:'74%'},
 {id:'D03',name:'Selvam P.',licence:'TN3420150000921',phone:'97900 10394',branch:'B02',type:'Regular',status:'Active',approval:'Approved',present:26,absent:0,util:'92%'},
 {id:'D04',name:'Ibrahim K.',licence:'TN3420200005566',phone:'97900 66211',branch:'B02',type:'Supporting',status:'Active',approval:'Approved',present:18,absent:8,util:'61%'},
 {id:'D05',name:'Venkatesh G.',licence:'TS0920180003344',phone:'90000 33445',branch:'B03',type:'Regular',status:'Active',approval:'Approved',present:25,absent:1,util:'90%'},
 {id:'D06',name:'Basavaraj H.',licence:'KA0120160009087',phone:'98860 90871',branch:'B04',type:'Regular',status:'Active',approval:'Approved',present:20,absent:6,util:'70%'},
 {id:'D07',name:'Anbu M.',licence:'TN2820210002209',phone:'90031 22090',branch:'B01',type:'Supporting',status:'Pending',approval:'Pending approval',present:0,absent:0,util:'\u2014'},
 {id:'D08',name:'Sachin P.',licence:'MH0420190006612',phone:'98200 66120',branch:'B05',type:'Regular',status:'Active',approval:'Approved',present:23,absent:3,util:'81%'},
 {id:'D09',name:'Ravi T.',licence:'TN2820120008890',phone:'90031 88900',branch:'B01',type:'Regular',status:'Inactive',approval:'Approved',present:0,absent:26,util:'0%'},
 {id:'D10',name:'Gopal R.',licence:'TN2820180007740',phone:'90031 44512',branch:'B01',type:'Regular',status:'Active',approval:'Approved',present:21,absent:5,util:'78%'},
 {id:'D11',name:'Saravanan K.',licence:'TN2820200008812',phone:'90031 77320',branch:'B01',type:'Supporting',status:'Active',approval:'Approved',present:19,absent:7,util:'66%'},
 {id:'D12',name:'Senthil V.',licence:'TN2820160003318',phone:'90031 51240',branch:'B01',type:'Regular',status:'Active',approval:'Approved',present:23,absent:3,util:'84%'},
 {id:'D13',name:'Arul P.',licence:'TN2820190006645',phone:'90031 62011',branch:'B01',type:'Regular',status:'Active',approval:'Approved',present:24,absent:2,util:'86%'},
 {id:'D14',name:'Mani K.',licence:'TN2820210001902',phone:'90031 70455',branch:'B01',type:'Supporting',status:'Active',approval:'Approved',present:20,absent:6,util:'71%'}
];
const clients=[
 {id:'C01',name:'INOX Air Products',gst:'33AAACI4521F1Z6',branch:'B01',phone:'98410 11220',supervisorIds:['S01','S06'],supervisors:'R. Senthil Kumar, A. Deshmukh',customers:4,contact:'Cryogenic desk, Sriperumbudur',status:'Active'},
 {id:'C02',name:'Linde India',gst:'33AAACL0123M1Z2',branch:'B01',phone:'98410 22330',supervisorIds:['S01','S03'],supervisors:'R. Senthil Kumar, K. Vijayalakshmi',customers:3,contact:'Central dispatch, Chennai',status:'Active'},
 {id:'C03',name:'Air Liquide India',gst:'33AAACA7896R1Z8',branch:'B02',phone:'98430 33440',supervisorIds:['S02'],supervisors:'M. Arunachalam',customers:2,contact:'Distribution, Namakkal',status:'Active'},
 {id:'C04',name:'Bharat Petroleum',gst:'36AAACB4567P1Z1',branch:'B03',phone:'90000 44550',supervisorIds:['S04'],supervisors:'P. Ramesh Babu',customers:1,contact:'Fuels terminal, Hyderabad',status:'Active'},
 {id:'C05',name:'Suguna Foods',gst:'33AAACS3456K1Z9',branch:'B01',phone:'99400 55660',supervisorIds:['S03'],supervisors:'K. Vijayalakshmi',customers:1,contact:'Cold chain desk, Chennai',status:'On hold'},
 {id:'C06',name:'Hindustan Petroleum',gst:'29AAACH2233Q1Z4',branch:'B04',phone:'98860 66770',supervisorIds:['S05'],supervisors:'S. Nagaraj',customers:1,contact:'Bommasandra terminal',status:'Active'}
];
const customers=[
 {id:'U01',name:'Yashoda Hospitals LOX Bank \u2013 Hyderabad',client:'C01',city:'Hyderabad',route:'R01',billing:'Per trip',status:'Active'},
 {id:'U02',name:'INOX Filling Station \u2013 Bengaluru',client:'C01',city:'Bengaluru',route:'R02',billing:'Per trip',status:'Active'},
 {id:'U03',name:'Sakthi Auto Components \u2013 Coimbatore',client:'C01',city:'Coimbatore',route:'R03',billing:'Per km',status:'Active'},
 {id:'U04',name:'Serum Institute Cryo Store \u2013 Pune',client:'C01',city:'Pune',route:'R04',billing:'Per trip',status:'Inactive'},
 {id:'U05',name:'Linde ASU \u2013 Vijayawada',client:'C02',city:'Vijayawada',route:'R05',billing:'Per trip',status:'Active'},
 {id:'U06',name:'Apollo Hospitals LMO Bank \u2013 Chennai',client:'C02',city:'Chennai',route:'R06',billing:'Per trip',status:'Active'},
 {id:'U07',name:'Meenakshi Mission Hospital \u2013 Madurai',client:'C02',city:'Madurai',route:'R07',billing:'Per km',status:'Active'},
 {id:'U08',name:'Air Liquide Depot \u2013 Bengaluru',client:'C03',city:'Bengaluru',route:'R02',billing:'Per trip',status:'Active'},
 {id:'U09',name:'Cochin Shipyard Gas Yard \u2013 Kochi',client:'C03',city:'Kochi',route:'R08',billing:'Per trip',status:'Active'},
 {id:'U10',name:'BPCL Fuel Terminal \u2013 Mumbai',client:'C04',city:'Mumbai',route:'R09',billing:'Per trip',status:'Active'},
 {id:'U11',name:'Suguna Cold Store \u2013 Chennai',client:'C05',city:'Chennai',route:'R06',billing:'Per trip',status:'Active'},
 {id:'U12',name:'HPCL Bottling Plant \u2013 Bengaluru',client:'C06',city:'Bengaluru',route:'R02',billing:'Per trip',status:'Active'}
];
const locations=[
 {id:'L01',client:'C01',clientId:'C01',name:'Sriperumbudur Cryogenic Hub',branch:'B01',address:'SIPCOT Phase 2, Sriperumbudur',radius:100,lat:'12.9605',lng:'79.9412',status:'Active'},
 {id:'L02',client:'C02',clientId:'C02',name:'Ambattur Cold Store',branch:'B01',address:'Ambattur Industrial Estate, Chennai',radius:100,lat:'13.1143',lng:'80.1548',status:'Active'},
 {id:'L03',client:'C03',clientId:'C03',name:'Namakkal Yard',branch:'B02',address:'Salem Main Road, Namakkal',radius:150,lat:'11.2189',lng:'78.1674',status:'Active'},
 {id:'L04',client:'C04',clientId:'C04',name:'Jeedimetla Plant Gate 2',branch:'B03',address:'Jeedimetla, Hyderabad',radius:100,lat:'17.5066',lng:'78.4530',status:'Active'},
 {id:'L05',client:'C06',clientId:'C06',name:'Bommasandra Loading Bay',branch:'B04',address:'Bommasandra Industrial Area',radius:100,lat:'12.8060',lng:'77.6990',status:'Active'},
 {id:'L06',client:'C01',clientId:'C01',name:'Bhiwandi Warehouse',branch:'B05',address:'Bhiwandi, Thane',radius:200,lat:'19.2813',lng:'73.0483',status:'Inactive'}
];
const bunks=[
 {id:'F01',name:'IOC – Sriperumbudur Highway',branch:'B01',rate:94.80,status:'Active'},
 {id:'F02',name:'HP – Ambattur Industrial Estate',branch:'B01',rate:95.20,status:'Active'},
 {id:'F03',name:'BPCL – Poonamallee Bypass',branch:'B01',rate:94.60,status:'Active'},
 {id:'F04',name:'IOC – Namakkal Salem Road',branch:'B02',rate:93.90,status:'Active'},
 {id:'F05',name:'HP – Jeedimetla',branch:'B03',rate:96.40,status:'Active'}
];
const routes=[
 {id:'R01',dieselLimit:255,name:'Sriperumbudur \u2192 Hyderabad',from:'L01',to:'Hyderabad',km:628,hours:14,toll:'\u20B92,340',status:'Active'},
 {id:'R02',dieselLimit:125,name:'Sriperumbudur \u2192 Bengaluru',from:'L01',to:'Bengaluru',km:312,hours:7,toll:'\u20B91,120',status:'Active'},
 {id:'R03',dieselLimit:195,name:'Sriperumbudur \u2192 Coimbatore',from:'L01',to:'Coimbatore',km:486,hours:9,toll:'\u20B91,480',status:'Active'},
 {id:'R04',dieselLimit:465,name:'Sriperumbudur \u2192 Pune',from:'L01',to:'Pune',km:1152,hours:24,toll:'\u20B94,010',status:'Active'},
 {id:'R05',dieselLimit:185,name:'Ambattur \u2192 Vijayawada',from:'L02',to:'Vijayawada',km:452,hours:9,toll:'\u20B91,610',status:'Active'},
 {id:'R06',dieselLimit:80,name:'Ambattur \u2192 Chennai city',from:'L02',to:'Chennai',km:200,hours:1,toll:'\u20B90',status:'Active'},
 {id:'R07',dieselLimit:190,name:'Ambattur \u2192 Madurai',from:'L02',to:'Madurai',km:470,hours:9,toll:'\u20B91,380',status:'Active'},
 {id:'R08',dieselLimit:155,name:'Namakkal \u2192 Kochi',from:'L03',to:'Kochi',km:378,hours:9,toll:'\u20B9940',status:'Active'},
 {id:'R09',dieselLimit:285,name:'Jeedimetla \u2192 Mumbai',from:'L04',to:'Mumbai',km:712,hours:16,toll:'\u20B92,980',status:'Under review'}
];
const trips=[
 {id:'T01',number:'TN28AQ4521/09/014',branch:'B01',client:'C01',customers:['U01'],vehicle:'V01',driver:'D01',loading:'L01',unloading:'Yashoda Hospitals LOX Bank \u2013 Hyderabad',startKm:125450,closeKm:null,type:'Business',status:'Enroute',opened:'14 Sep 2026 05:40',closed:null,supervisor:'S01',fixedKm:628,gpsKm:212,odoKm:null,invoice:null,lr:null,advance:null,diesel:null,qtyLoad:'18 kL liquid oxygen',qtyUnload:null,hoursOpen:6,flags:[]},
 {id:'T02',number:'TN34CV0921/09/021',branch:'B02',client:'C03',customers:['U08'],vehicle:'V03',driver:'D03',loading:'L03',unloading:'Air Liquide Depot \u2013 Bengaluru',startKm:210330,closeKm:null,type:'Business',status:'Enroute',opened:'13 Sep 2026 22:10',closed:null,supervisor:'S02',fixedKm:312,gpsKm:298,odoKm:null,invoice:null,lr:null,advance:null,diesel:null,qtyLoad:'16 kL liquid nitrogen',qtyUnload:null,hoursOpen:13,flags:['GPS weak','Route diversion 31 km'],diversion:{expected:'NH44 via Krishnagiri',actual:'SH-17 through Hosur town',at:'Krishnagiri toll plaza',offKm:31,minutes:48,extraKm:18,detected:'14 Sep 2026 10:24',state:'Off route now'}},
 {id:'T03',number:'TS09UB3344/09/009',branch:'B03',client:'C04',customers:['U10'],vehicle:'V05',driver:'D05',loading:'L04',unloading:'BPCL Fuel Terminal \u2013 Mumbai',startKm:154880,closeKm:null,type:'Business',status:'Enroute',opened:'12 Sep 2026 18:05',closed:null,supervisor:'S04',fixedKm:712,gpsKm:410,odoKm:null,invoice:null,lr:null,advance:null,diesel:null,qtyLoad:'24 kL diesel',qtyUnload:null,hoursOpen:41,flags:['Long open','GPS failed']},
 {id:'T04',number:'KA01AJ9087/09/031',branch:'B04',client:'C06',customers:['U12'],vehicle:'V07',driver:'D06',loading:'L05',unloading:'HPCL Bottling Plant \u2013 Bengaluru',startKm:44510,closeKm:null,type:'Non-Business',reason:'Empty Return',track:{lastFix:'1 min ago',maxSpeed:52,avgSpeed:31,idleMin:22,stops:2,points:[['08:20','Left Bommasandra Loading Bay',0],['08:58','Idle 14 min \u00b7 Electronic City toll',18],['09:40','Idle 8 min \u00b7 Hosur Road signal',31],['11:02','Position update \u00b7 Bommanahalli',44]]},status:'Enroute',opened:'14 Sep 2026 08:20',closed:null,supervisor:'S05',fixedKm:0,gpsKm:44,odoKm:null,invoice:null,lr:null,advance:null,diesel:null,qtyLoad:'\u2014',qtyUnload:null,hoursOpen:3,flags:[]},
 {id:'T05',number:'MH04GH6612/09/017',branch:'B05',client:'C01',customers:['U04'],vehicle:'V09',driver:'D08',loading:'L06',unloading:'Serum Institute Cryo Store \u2013 Pune',startKm:201115,closeKm:null,type:'Business',status:'Enroute',opened:'14 Sep 2026 09:02',closed:null,supervisor:'S06',fixedKm:148,gpsKm:36,odoKm:null,invoice:null,lr:null,advance:null,diesel:null,qtyLoad:'14 kL liquid oxygen',qtyUnload:null,hoursOpen:2,flags:['Route diversion 12 km'],diversion:{expected:'Mumbai\u2013Pune Expressway',actual:'Old NH48 through Lonavala town',at:'Khalapur toll plaza',offKm:12,minutes:26,extraKm:9,detected:'14 Sep 2026 10:05',state:'Rejoined'}},
 {id:'T06',expBreakdown:{dieselCash:0,driverBata:1200,cleanerBata:600,rto:0,toll:1450,weighment:350},otherExpenses:[{name:'Loading labour',amount:800},{name:'Tarpaulin rope',amount:240}],number:'TN28AQ4521/09/013',branch:'B01',client:'C01',customers:['U02','U03'],vehicle:'V01',driver:'D01',loading:'L01',unloading:'INOX Filling Station \u2013 Bengaluru, Sakthi Auto Components \u2013 Coimbatore',startKm:124640,closeKm:125450,type:'Business',status:'Closed',opened:'11 Sep 2026 06:10',closed:'12 Sep 2026 19:45',supervisor:'S01',fixedKm:798,gpsKm:804,odoKm:810,invoice:'SP/INV/22871',lr:'LR-004412',bunk:'IOC \u2013 Sriperumbudur Highway',rate:94.80,advance:'\u20B98,000',diesel:'320 L',dieselLitres:320,dieselTotal:30336,totalExpense:'\u20B934,500',qtyLoad:'20 kL liquid oxygen',qtyUnload:'20 kL liquid oxygen',remarks:'Multi-drop delivery for Bangalore and Coimbatore',closeRemarks:'Completed on schedule, all seals verified',hoursOpen:37,flags:[]},
 {id:'T07',expBreakdown:{dieselCash:0,driverBata:900,cleanerBata:450,rto:0,toll:1610,weighment:300},otherExpenses:[{name:'Parking · Vijayawada',amount:180}],number:'TN28BC1180/09/008',branch:'B01',client:'C02',customers:['U05'],vehicle:'V02',driver:'D02',loading:'L02',unloading:'Linde ASU \u2013 Vijayawada',startKm:97700,closeKm:98210,type:'Business',status:'Closed',opened:'10 Sep 2026 07:30',closed:'11 Sep 2026 14:20',supervisor:'S03',fixedKm:452,gpsKm:474,odoKm:510,invoice:'CP/INV/10933',lr:'LR-004398',bunk:'HP \u2013 Ambattur Industrial Estate',rate:95.20,advance:'\u20B95,000',diesel:'180 L',dieselLitres:180,dieselTotal:17136,totalExpense:'\u20B919,800',qtyLoad:'18 kL liquid argon',qtyUnload:'18 kL liquid argon',remarks:'Argon tanker movement with safety clearance',closeRemarks:'Route diversion due to road work at Ongole bypass',hoursOpen:31,flags:['Variance 12.8%','Route diversion 22 km'],diversion:{expected:'NH16 via Ongole',actual:'SH-48 through Chimakurthi',at:'Ongole bypass',offKm:22,minutes:41,extraKm:22,detected:'11 Sep 2026 03:40',state:'Reviewed'}},
 {id:'T08',expBreakdown:{dieselCash:0,driverBata:400,cleanerBata:0,rto:0,toll:0,weighment:150},otherExpenses:[{name:'Unloading help',amount:250}],number:'TN28BD2209/09/011',branch:'B01',client:'C02',customers:['U06'],vehicle:'V08',driver:'D07',loading:'L02',unloading:'Apollo Hospitals LMO Bank \u2013 Chennai',startKm:132540,closeKm:132760,type:'Business',status:'Closed',opened:'13 Sep 2026 10:00',closed:'13 Sep 2026 15:35',supervisor:'S03',fixedKm:200,gpsKm:208,odoKm:220,invoice:'CP/INV/10951',lr:null,bunk:'BPCL \u2013 Poonamallee Bypass',rate:94.60,advance:'\u20B91,000',diesel:'40 L',dieselLitres:40,dieselTotal:3784,totalExpense:'\u20B94,600',qtyLoad:'12 kL liquid oxygen',qtyUnload:'12 kL liquid oxygen',remarks:'Hospital emergency refill',closeRemarks:'Delivered directly to hospital tank',hoursOpen:5,flags:['Variance 10%']},
 {id:'T09',expBreakdown:{dieselCash:0,driverBata:300,cleanerBata:0,rto:450,toll:120,weighment:0},otherExpenses:[],number:'TN34CQ5566/09/006',branch:'B02',client:'C03',customers:[],vehicle:'V06',driver:'D04',loading:'L03',unloading:'Namakkal service bay',startKm:186940,closeKm:187002,type:'Non-Business',reason:'Maintenance',track:{lastFix:'at close',maxSpeed:48,avgSpeed:28,idleMin:35,stops:1,points:[['09:15','Left Namakkal Yard',0],['09:52','Fuel stop \u00b7 Salem Road',21],['10:40','Arrived at service bay',58],['11:50','Trip closed at service bay',60]]},status:'Closed',opened:'12 Sep 2026 09:15',closed:'12 Sep 2026 11:50',supervisor:'S02',fixedKm:0,gpsKm:60,odoKm:62,invoice:null,lr:null,bunk:null,rate:0,advance:'\u20B90',diesel:'0 L',dieselLitres:0,dieselTotal:0,totalExpense:'\u20B9500',qtyLoad:'\u2014',qtyUnload:'\u2014',remarks:'Scheduled brake overhaul',closeRemarks:'Service completed, handed over to yard',hoursOpen:2,flags:[]},
 {id:'T10',expBreakdown:{dieselCash:0,driverBata:350,cleanerBata:0,rto:0,toll:0,weighment:0},otherExpenses:[{name:'Cold store entry fee',amount:300}],number:'TN28AQ8890/09/019',branch:'B01',client:'C05',customers:['U11'],vehicle:'V10',driver:'D09',loading:'L02',unloading:'Suguna Cold Store \u2013 Chennai',startKm:75245,closeKm:75300,type:'Business',status:'Closed',opened:'13 Sep 2026 14:00',closed:'13 Sep 2026 17:10',supervisor:'S01',fixedKm:200,gpsKm:null,odoKm:55,invoice:'LP/INV/0781',lr:'LR-004430',bunk:'HP \u2013 Ambattur Industrial Estate',rate:95.20,advance:'\u20B9500',diesel:'20 L',dieselLitres:20,dieselTotal:1904,totalExpense:'\u20B92,400',qtyLoad:'120 cartons',qtyUnload:'120 cartons',remarks:'Direct drop at Suguna cold store',closeRemarks:'Unloaded and verified carton count',hoursOpen:3,flags:['GPS missing','Hidden km 55']},
 {id:'T21',number:'TN28CK3310/09/006',branch:'B01',client:'C01',customers:['U02'],vehicle:'V11',driver:'D12',loading:'L01',unloading:'INOX Filling Station \u2013 Bengaluru',startKm:88420,closeKm:null,type:'Business',status:'Enroute',stage:'Loading',opened:'14 Sep 2026 08:50',closed:null,supervisor:'S01',fixedKm:312,gpsKm:0,odoKm:null,invoice:null,lr:null,advance:null,diesel:null,qtyLoad:null,qtyUnload:null,hoursOpen:1,flags:[]},
 {id:'T22',number:'TN28CM6645/09/011',branch:'B01',client:'C02',customers:['U06'],vehicle:'V12',driver:'D13',loading:'L02',unloading:'Apollo Hospitals LMO Bank \u2013 Chennai',startKm:143905,closeKm:null,type:'Business',status:'Enroute',stage:'Unloading',opened:'14 Sep 2026 04:15',closed:null,supervisor:'S01',fixedKm:200,gpsKm:194,odoKm:null,invoice:null,lr:null,advance:null,diesel:null,qtyLoad:'12 kL liquid oxygen',qtyUnload:null,hoursOpen:5,flags:[]},
 {id:'T23',number:'TN28BZ1902/09/004',branch:'B01',client:'C02',customers:['U05'],vehicle:'V13',driver:'D14',loading:'L02',unloading:'Linde ASU \u2013 Vijayawada',startKm:59870,closeKm:null,type:'Business',status:'Enroute',stage:'Delayed',opened:'13 Sep 2026 19:30',closed:null,supervisor:'S01',fixedKm:452,gpsKm:236,odoKm:null,invoice:null,lr:null,advance:null,diesel:null,qtyLoad:'9 kL liquid argon',qtyUnload:null,hoursOpen:14,flags:[]},
{id:'T11',number:'TN28AR7712/09/022',branch:'B01',client:'C01',customers:['U01'],vehicle:'V04',driver:'D10',loading:'L01',unloading:'Yashoda Hospitals LOX Bank – Hyderabad',startKm:60110,closeKm:60745,type:'Business',status:'Closed',opened:'15 Sep 2026 05:15',closed:'16 Sep 2026 12:40',supervisor:'S01',fixedKm:628,gpsKm:633,odoKm:635,invoice:'SP/INV/11042',lr:'LR-004512',bunk:'IOC – Sriperumbudur Highway',rate:96.4,advance:'₹8,000',diesel:'282 L',dieselLitres:282,dieselTotal:27185,totalExpense:'₹34,900',expBreakdown:{dieselCash:0,driverBata:1400,cleanerBata:700,rto:0,toll:2340,weighment:400},otherExpenses:[{name:'Loading labour',amount:850},{name:'Night halt',amount:600}],qtyLoad:'18 kL liquid oxygen',qtyUnload:'18 kL liquid oxygen',remarks:'LOX run to Hyderabad hospital bank',closeRemarks:'Extra fill taken at Kurnool, driver reported heavy headwind',hoursOpen:31,flags:[]},
 {id:'T12',number:'TN28BC1180/09/026',branch:'B01',client:'C02',customers:['U07'],vehicle:'V02',driver:'D02',loading:'L02',unloading:'Meenakshi Mission Hospital – Madurai',startKm:98210,closeKm:98695,type:'Business',status:'Closed',opened:'16 Sep 2026 06:40',closed:'16 Sep 2026 21:05',supervisor:'S03',fixedKm:470,gpsKm:479,odoKm:485,invoice:'CP/INV/11067',lr:'LR-004530',bunk:'BPCL – Dindigul Bypass',rate:95.2,advance:'₹6,000',diesel:'245 L',dieselLitres:245,dieselTotal:23324,totalExpense:'₹28,600',expBreakdown:{dieselCash:0,driverBata:1100,cleanerBata:550,rto:350,toll:1380,weighment:300},otherExpenses:[{name:'Unloading help',amount:400}],qtyLoad:'16 kL liquid oxygen',qtyUnload:'16 kL liquid oxygen',remarks:'Hospital LMO delivery, priority load',closeRemarks:'Second bunk fill at Dindigul, no slip photo attached',hoursOpen:14,flags:[]},
 {id:'T13',number:'TS09UB3344/09/014',branch:'B03',client:'C04',customers:['U10'],vehicle:'V05',driver:'D05',loading:'L04',unloading:'BPCL Fuel Terminal – Mumbai',startKm:153900,closeKm:154610,type:'Business',status:'Closed',opened:'14 Sep 2026 04:20',closed:'15 Sep 2026 22:15',supervisor:'S04',fixedKm:712,gpsKm:706,odoKm:710,invoice:'HY/INV/10884',lr:'LR-004489',bunk:'HP – Solapur Ring Road, IOC – Pune Highway',rate:98.1,advance:'₹12,000',diesel:'372 L',dieselLitres:372,dieselTotal:36493,totalExpense:'₹46,200',expBreakdown:{dieselCash:0,driverBata:1800,cleanerBata:900,rto:600,toll:2980,weighment:450},otherExpenses:[{name:'Terminal entry fee',amount:750},{name:'Tarpaulin rope',amount:280},{name:'Driver food advance',amount:500}],qtyLoad:'24 kL diesel',qtyUnload:'24 kL diesel',remarks:'Interstate fuel movement to Mumbai terminal',closeRemarks:'Filled at two bunks; driver says tanker ran heavy through the ghats',hoursOpen:42,flags:[]}
];
const exceptions=[
 {id:'X01',type:'Hidden kilometres',severity:'High',vehicle:'V10',branch:'B01',trip:'T10',detail:'Trip TN28AQ8890/09/018 closed at 75,190 km; trip /09/019 started at 75,245 km. 55 km unaccounted.',raised:'13 Sep 2026 14:02',status:'Open',assignee:'Unassigned'},
 {id:'X02',type:'Distance variance',severity:'High',vehicle:'V02',branch:'B01',trip:'T07',detail:'Fixed 452 km, GPS 474 km, odometer 510 km. Variance 12.8% exceeds 5% threshold.',raised:'11 Sep 2026 14:21',status:'Under review',assignee:'Head Office Admin'},
 {id:'X03',type:'Route diversion',severity:'Medium',vehicle:'V02',branch:'B01',trip:'T07',detail:'Actual route deviated from expected NH16 corridor near Ongole by 22 km.',raised:'11 Sep 2026 03:40',status:'Open',assignee:'Unassigned'},
 {id:'X04',type:'GPS failure',severity:'High',vehicle:'V05',branch:'B03',trip:'T03',detail:'No GPS fix for 2 h 14 min. Odometer working; distance falls back to odometer reading.',raised:'14 Sep 2026 09:26',status:'Open',assignee:'Unassigned'},
 {id:'X05',type:'Long open trip',severity:'Medium',vehicle:'V05',branch:'B03',trip:'T03',detail:'Trip open for 41 h against expected 16 h transit.',raised:'13 Sep 2026 10:05',status:'Open',assignee:'P. Ramesh Babu'},
 {id:'X06',type:'Radius breach',severity:'Low',vehicle:'V04',branch:'B01',trip:null,detail:'Vehicle left Ambattur Cold Store 100 m safe radius at 02:14 without an open trip. Returned 03:05.',raised:'14 Sep 2026 02:14',status:'Open',assignee:'Unassigned'},
 {id:'X07',type:'Missing attendance',severity:'Low',vehicle:null,branch:'B04',trip:null,detail:'Bengaluru branch has 3 of 31 days incomplete for September driver attendance.',raised:'14 Sep 2026 00:05',status:'Open',assignee:'S. Nagaraj'},
 {id:'X08',type:'Distance variance',severity:'Medium',vehicle:'V08',branch:'B01',trip:'T08',detail:'Fixed 200 km, GPS 208 km, odometer 220 km. Variance 10%.',raised:'13 Sep 2026 15:36',status:'Resolved',assignee:'Head Office Admin'},
 {id:'X09',type:'Both sources failed',severity:'High',vehicle:'V03',branch:'B02',trip:'T02',detail:'GPS weak and odometer not captured at open. Manual exception required at close.',raised:'14 Sep 2026 06:50',status:'Open',assignee:'Unassigned'},
 {id:'X11',type:'Route diversion',severity:'High',vehicle:'V03',branch:'B02',trip:'T02',detail:'Left the NH44 corridor at Krishnagiri toll plaza onto SH-17 through Hosur town. 31 km off route for 48 min and still off route.',raised:'14 Sep 2026 10:24',status:'Open',assignee:'Unassigned'},
 {id:'X12',type:'Route diversion',severity:'Low',vehicle:'V09',branch:'B05',trip:'T05',detail:'Left the Mumbai\u2013Pune Expressway at Khalapur toll onto old NH48. 12 km off route for 26 min, rejoined at Lonavala.',raised:'14 Sep 2026 10:05',status:'Open',assignee:'A. Deshmukh'},
 {id:'X10',type:'Idle vehicles',severity:'Medium',vehicle:'V04',branch:'B01',trip:null,detail:'Vehicle parked at Ambattur yard with no open trip or driver for 52 h. Idle limit is 24 h.',raised:'14 Sep 2026 08:00',status:'Open',assignee:'Unassigned'},
 {id:'X13',type:'Hidden kilometres',severity:'High',vehicle:'V01',branch:'B01',trip:null,detail:'Trip TN28AQ4521/09/012 closed at 124,588 km; trip /09/013 started at 124,640 km. 52 km unaccounted.',raised:'11 Sep 2026 06:12',status:'Open',assignee:'Unassigned'},
 {id:'X14',type:'Hidden kilometres',severity:'Medium',vehicle:'V08',branch:'B01',trip:'T08',detail:'Trip TN28BD2209/09/010 closed at 132,512 km; trip /09/011 started at 132,540 km. 28 km unaccounted.',raised:'13 Sep 2026 10:02',status:'Under review',assignee:'Head Office Admin'},
 {id:'X15',type:'Hidden kilometres',severity:'Medium',vehicle:'V06',branch:'B02',trip:'T09',detail:'Trip TN34CQ5566/09/005 closed at 186,905 km; trip /09/006 started at 186,940 km. 35 km unaccounted.',raised:'12 Sep 2026 09:17',status:'Open',assignee:'M. Arunachalam'},
 {id:'X16',type:'Hidden kilometres',severity:'Medium',vehicle:'V07',branch:'B04',trip:'T04',detail:'Trip KA01AJ9087/09/030 closed at 44,489 km; trip /09/031 started at 44,510 km. 21 km unaccounted.',raised:'14 Sep 2026 08:22',status:'Open',assignee:'Unassigned'},
 {id:'X17',type:'Hidden kilometres',severity:'High',vehicle:'V05',branch:'B03',trip:'T03',detail:'Trip TS09UB3344/09/008 closed at 154,834 km; trip /09/009 started at 154,880 km. 46 km unaccounted.',raised:'12 Sep 2026 18:07',status:'Open',assignee:'P. Ramesh Babu'},
 {id:'X18',type:'Hidden kilometres',severity:'Low',vehicle:'V02',branch:'B01',trip:'T07',detail:'Trip TN28BC1180/09/007 closed at 97,691 km; trip /09/008 started at 97,700 km. 9 km of yard shunting confirmed.',raised:'10 Sep 2026 07:32',status:'Resolved',assignee:'R. Senthil Kumar'},
 {id:'X19',type:'Distance variance',severity:'High',vehicle:'V02',branch:'B01',trip:null,detail:'Trip TN28BC1180/09/006: fixed 470 km, GPS 489 km, odometer 531 km. Variance 13% exceeds 5% threshold.',raised:'08 Sep 2026 18:40',status:'Open',assignee:'Unassigned'},
 {id:'X20',type:'Distance variance',severity:'Medium',vehicle:'V10',branch:'B01',trip:null,detail:'Trip TN28AQ8890/09/017: fixed 200 km, GPS 207 km, odometer 214 km. Variance 7%.',raised:'12 Sep 2026 16:05',status:'Open',assignee:'R. Senthil Kumar'},
 {id:'X21',type:'Distance variance',severity:'Medium',vehicle:'V03',branch:'B02',trip:null,detail:'Trip TN34CV0921/09/019: fixed 312 km, GPS 331 km, odometer 336 km. Variance 7.7%.',raised:'11 Sep 2026 20:30',status:'Under review',assignee:'Head Office Admin'},
 {id:'X22',type:'Distance variance',severity:'High',vehicle:'V05',branch:'B03',trip:null,detail:'Trip TS09UB3344/09/007: fixed 712 km, GPS 768 km, odometer 801 km. Variance 12.5% exceeds 5% threshold.',raised:'10 Sep 2026 12:48',status:'Open',assignee:'P. Ramesh Babu'},
 {id:'X23',type:'Distance variance',severity:'Medium',vehicle:'V09',branch:'B05',trip:null,detail:'Trip MH04GH6612/09/015: fixed 148 km, GPS 157 km, odometer 159 km. Variance 7.4%.',raised:'13 Sep 2026 19:12',status:'Open',assignee:'Unassigned'},
 {id:'X24',type:'Distance variance',severity:'Medium',vehicle:'V07',branch:'B04',trip:null,detail:'Trip KA01AJ9087/09/029: fixed 312 km, GPS 334 km, odometer 338 km. Variance 8.3%.',raised:'09 Sep 2026 22:15',status:'Open',assignee:'S. Nagaraj'},
 {id:'X25',type:'Distance variance',severity:'High',vehicle:'V01',branch:'B01',trip:null,detail:'Trip TN28AQ4521/09/011: fixed 628 km, GPS 671 km, odometer 702 km. Variance 11.8% exceeds 5% threshold.',raised:'09 Sep 2026 21:05',status:'Open',assignee:'Unassigned'},
 {id:'X26',type:'GPS failure',severity:'High',vehicle:'V03',branch:'B02',trip:null,detail:'GPS device offline for 2 h 40 min on NH44 near Dharmapuri. Odometer reading used for the gap.',raised:'12 Sep 2026 23:40',status:'Open',assignee:'M. Arunachalam'},
 {id:'X27',type:'GPS failure',severity:'Medium',vehicle:'V09',branch:'B05',trip:null,detail:'No GPS fix for 52 min inside the Bhiwandi Warehouse compound. Signal restored on exit.',raised:'13 Sep 2026 07:15',status:'Open',assignee:'Unassigned'},
 {id:'X28',type:'GPS failure',severity:'Medium',vehicle:'V01',branch:'B01',trip:'T01',detail:'Intermittent GPS on NH16 near Nellore bypass. 6 position gaps in 38 min.',raised:'14 Sep 2026 09:05',status:'Under review',assignee:'R. Senthil Kumar'},
 {id:'X29',type:'GPS failure',severity:'High',vehicle:'V07',branch:'B04',trip:null,detail:'GPS device power disconnected for 3 h 05 min while parked at Bommasandra. Possible tampering.',raised:'11 Sep 2026 01:30',status:'Open',assignee:'S. Nagaraj'},
 {id:'X30',type:'GPS failure',severity:'Medium',vehicle:'V05',branch:'B03',trip:null,detail:'No GPS fix for 1 h 10 min near Zaheerabad on NH65. Odometer used for the gap.',raised:'10 Sep 2026 15:20',status:'Open',assignee:'P. Ramesh Babu'},
 {id:'X31',type:'GPS failure',severity:'High',vehicle:'V10',branch:'B01',trip:'T10',detail:'No GPS data for the whole of trip TN28AQ8890/09/019. Device silent since 13 Sep 13:40.',raised:'13 Sep 2026 17:12',status:'Open',assignee:'Unassigned'},
 {id:'X32',type:'Both sources failed',severity:'High',vehicle:'V05',branch:'B03',trip:'T03',detail:'GPS failed and the opening odometer photo is unreadable. Closing distance must be entered manually.',raised:'12 Sep 2026 18:20',status:'Open',assignee:'Unassigned'},
 {id:'X33',type:'Long open trip',severity:'High',vehicle:'V01',branch:'B01',trip:null,detail:'Trip TN28AQ4521/09/011 was open for 52 h against an expected 14 h transit.',raised:'09 Sep 2026 20:10',status:'Under review',assignee:'Head Office Admin'},
 {id:'X34',type:'Long open trip',severity:'Medium',vehicle:'V09',branch:'B05',trip:null,detail:'Trip MH04GH6612/09/016 open for 9 h against an expected 4 h transit.',raised:'13 Sep 2026 15:40',status:'Open',assignee:'A. Deshmukh'},
 {id:'X35',type:'Long open trip',severity:'Medium',vehicle:'V03',branch:'B02',trip:'T02',detail:'Trip TN34CV0921/09/021 open for 13 h against an expected 7 h transit.',raised:'14 Sep 2026 05:10',status:'Open',assignee:'M. Arunachalam'},
 {id:'X36',type:'Long open trip',severity:'Medium',vehicle:'V07',branch:'B04',trip:null,detail:'Trip KA01AJ9087/09/029 was open for 18 h against an expected 7 h transit.',raised:'09 Sep 2026 14:30',status:'Open',assignee:'Unassigned'},
 {id:'X37',type:'Missing attendance',severity:'Low',vehicle:null,branch:'B02',trip:null,detail:'Namakkal branch has 2 of 31 days incomplete for September driver attendance.',raised:'14 Sep 2026 00:05',status:'Open',assignee:'M. Arunachalam'},
 {id:'X38',type:'Missing attendance',severity:'Low',vehicle:null,branch:'B01',trip:null,detail:'Chennai HO attendance for 2, 7 and 9 September was not completed within 48 hours.',raised:'11 Sep 2026 00:05',status:'Open',assignee:'R. Senthil Kumar'},
 {id:'X39',type:'Missing attendance',severity:'Low',vehicle:null,branch:'B05',trip:null,detail:'Mumbai branch has 1 of 31 days incomplete for September driver attendance.',raised:'13 Sep 2026 00:05',status:'Under review',assignee:'A. Deshmukh'},
 {id:'X40',type:'Radius breach',severity:'Medium',vehicle:'V02',branch:'B01',trip:null,detail:'Vehicle left Sriperumbudur Cryogenic Hub 100 m safe radius at 23:48 without an open trip. Returned 01:20.',raised:'13 Sep 2026 23:48',status:'Open',assignee:'Unassigned'},
 {id:'X41',type:'Radius breach',severity:'Low',vehicle:'V08',branch:'B01',trip:null,detail:'Vehicle moved 240 m outside the Sriperumbudur Cryogenic Hub radius at 05:02 for 12 min. Driver reported a fuel top-up.',raised:'14 Sep 2026 05:02',status:'Open',assignee:'K. Vijayalakshmi'},
 {id:'X42',type:'Radius breach',severity:'Medium',vehicle:'V06',branch:'B02',trip:null,detail:'Vehicle left Namakkal Yard 150 m radius at 21:15 while marked Maintenance. Returned 22:40.',raised:'12 Sep 2026 21:15',status:'Open',assignee:'M. Arunachalam'},
 {id:'X43',type:'Radius breach',severity:'Low',vehicle:'V10',branch:'B01',trip:null,detail:'Vehicle left Ambattur Cold Store 100 m radius at 19:30 without an open trip. Returned 19:55.',raised:'12 Sep 2026 19:30',status:'Under review',assignee:'R. Senthil Kumar'},
 {id:'X44',type:'Radius breach',severity:'Medium',vehicle:'V07',branch:'B04',trip:null,detail:'Vehicle left Bommasandra Loading Bay 100 m radius at 03:10 without an open trip. Returned 04:25.',raised:'10 Sep 2026 03:10',status:'Open',assignee:'Unassigned'},
 {id:'X45',type:'Radius breach',severity:'Low',vehicle:'V05',branch:'B03',trip:'T03',detail:'Vehicle left Jeedimetla Plant Gate 2 radius at 17:45, 20 min before the trip was opened at 18:05.',raised:'12 Sep 2026 17:45',status:'Open',assignee:'P. Ramesh Babu'},
 {id:'X46',type:'Radius breach',severity:'Medium',vehicle:'V09',branch:'B05',trip:null,detail:'Vehicle left Bhiwandi Warehouse 200 m radius at 02:30 without an open trip. Returned 03:55.',raised:'11 Sep 2026 02:30',status:'Open',assignee:'Unassigned'},
 {id:'X47',type:'Radius breach',severity:'Medium',vehicle:'V04',branch:'B01',trip:null,detail:'Vehicle left Ambattur Cold Store 100 m radius at 22:40 with no open trip or driver. Returned 23:30.',raised:'12 Sep 2026 22:40',status:'Open',assignee:'Unassigned'},
 {id:'X48',type:'Radius breach',severity:'Low',vehicle:'V03',branch:'B02',trip:'T02',detail:'Vehicle left Namakkal Yard 150 m radius at 20:55, 75 min before the trip was opened at 22:10.',raised:'13 Sep 2026 20:55',status:'Open',assignee:'M. Arunachalam'},
 {id:'X49',type:'Radius breach',severity:'Low',vehicle:'V01',branch:'B01',trip:'T01',detail:'Vehicle left Sriperumbudur Cryogenic Hub radius at 05:18, 22 min before the trip was opened at 05:40.',raised:'14 Sep 2026 05:18',status:'Under review',assignee:'R. Senthil Kumar'},
 {id:'X50',type:'Idle vehicles',severity:'High',vehicle:'V06',branch:'B02',trip:null,detail:'Vehicle at Namakkal service bay with no open trip for 76 h. Maintenance finished 12 Sep but it was not released to operations.',raised:'14 Sep 2026 07:00',status:'Open',assignee:'M. Arunachalam'},
 {id:'X51',type:'Idle vehicles',severity:'Medium',vehicle:'V07',branch:'B04',trip:null,detail:'Vehicle parked at Bommasandra for 29 h before the current trip. Reason recorded: Waiting for loading.',raised:'13 Sep 2026 06:00',status:'Under review',assignee:'S. Nagaraj'},
 {id:'X52',type:'Idle vehicles',severity:'Medium',vehicle:'V09',branch:'B05',trip:null,detail:'Vehicle parked at Bhiwandi Warehouse for 27 h without a trip or an idle reason.',raised:'12 Sep 2026 11:30',status:'Open',assignee:'A. Deshmukh'},
 {id:'X53',type:'Idle vehicles',severity:'High',vehicle:'V05',branch:'B03',trip:null,detail:'Vehicle parked at Jeedimetla for 81 h without a trip. Driver on leave and no relief assigned.',raised:'11 Sep 2026 08:00',status:'Open',assignee:'Unassigned'},
 {id:'X54',type:'Idle vehicles',severity:'Medium',vehicle:'V10',branch:'B01',trip:null,detail:'Vehicle parked at Ambattur yard for 26 h before trip TN28AQ8890/09/019. Mapped driver Ravi T. is inactive.',raised:'13 Sep 2026 12:00',status:'Open',assignee:'R. Senthil Kumar'},
 {id:'X55',type:'Idle vehicles',severity:'Medium',vehicle:'V08',branch:'B01',trip:null,detail:'Vehicle parked at Sriperumbudur hub for 25 h before trip TN28BD2209/09/011 with no idle reason recorded.',raised:'13 Sep 2026 09:40',status:'Under review',assignee:'K. Vijayalakshmi'},
 {id:'X56',type:'Idle vehicles',severity:'Medium',vehicle:'V02',branch:'B01',trip:null,detail:'Vehicle parked at Sriperumbudur hub for 38 h between trips /09/007 and /09/008 with no idle reason.',raised:'10 Sep 2026 07:00',status:'Open',assignee:'Unassigned'},
 {id:'X57',type:'Idle vehicles',severity:'Medium',vehicle:'V03',branch:'B02',trip:null,detail:'Vehicle parked at Namakkal Yard for 31 h before trip TN34CV0921/09/021. Reason recorded: No business / no load.',raised:'13 Sep 2026 20:00',status:'Open',assignee:'M. Arunachalam'},
 {id:'X58',type:'Idle vehicles',severity:'Low',vehicle:'V01',branch:'B01',trip:null,detail:'Vehicle parked at Sriperumbudur hub for 34 h between trips /09/013 and /09/014. Cleared when the trip opened.',raised:'14 Sep 2026 05:40',status:'Resolved',assignee:'R. Senthil Kumar'}
];
const gpsLog=[
 {t:'05:40',ev:'Trip opened at Sriperumbudur Cryogenic Hub',km:0,speed:0},
 {t:'05:52',ev:'Left 100 m safe radius',km:1,speed:22},
 {t:'07:30',ev:'NH16 \u2013 Gummidipoondi toll',km:62,speed:64},
 {t:'09:10',ev:'Idle 18 min \u2013 Nellore bypass',km:174,speed:0},
 {t:'11:25',ev:'Position update',km:212,speed:58}
];
const users=[
 {id:'A01',name:'Head Office Admin',email:'admin@gmail.com',password:'admin@123',role:'Administrator',branch:'All branches',status:'Active',last:'Today 07:55'},
 {id:'A02',name:'Company Owner',email:'owner@transport.example',role:'Owner (read-only)',branch:'All branches',status:'Active',last:'Yesterday 19:12'},
 {id:'A05',name:'Billing Desk',email:'billing@transport.example',role:'Billing (read-only)',branch:'All branches',status:'Invited',last:'\u2014'}
];
const permissions=[
 {module:'Trips',admin:'Full',supervisor:'Own branch',owner:'View',billing:'View closed'},
 {module:'Edit / delete trip records',admin:'Yes',supervisor:'No',owner:'No',billing:'No'},
 {module:'Master data',admin:'Full',supervisor:'View',owner:'View',billing:'No'},
 {module:'Driver approval',admin:'Approve',supervisor:'Request',owner:'View',billing:'No'},
 {module:'Exceptions',admin:'Resolve',supervisor:'View own',owner:'View',billing:'No'},
 {module:'Attendance',admin:'Full',supervisor:'Record own branch',owner:'View',billing:'No'},
 {module:'Analytics & reports',admin:'Full + export',supervisor:'Own branch',owner:'Full',billing:'Billing only'},
 {module:'Users & roles',admin:'Full',supervisor:'No',owner:'No',billing:'No'}
];
const radiusAlerts=[
 {id:'RA01',kind:'vehicle',ref:'V04',location:'L02',left:'11:05',awayM:320},
 {id:'RA02',kind:'supervisor',ref:'S01',location:'L01',left:'11:05',awayM:180},
 {id:'RA03',kind:'vehicle',ref:'V10',location:'L02',left:'10:52',awayM:1800},
 {id:'RA04',kind:'supervisor',ref:'S02',location:'L03',left:'10:36',awayM:450},
 {id:'RA05',kind:'vehicle',ref:'V07',location:'L05',left:'10:18',awayM:640},
 {id:'RA06',kind:'supervisor',ref:'S04',location:'L04',left:'10:12',awayM:1200},
 {id:'RA07',kind:'vehicle',ref:'V09',location:'L06',left:'09:55',awayM:2100},
 {id:'RA08',kind:'vehicle',ref:'V06',location:'L03',left:'09:40',awayM:3400}
];
// Notices Head Office has sent to supervisors: messages written by the admin, and actions the admin took
// on something the supervisor raised. Live ones from the Admin Portal are added on top at runtime.
const supervisorNotices=[
 {id:'N01',kind:'message',branch:'B01',priority:'Urgent',from:'Head Office Admin',sort:'2026-09-14 08:15',title:'Photograph every diesel slip',body:'From Monday 15 September, attach a photo of the diesel slip when you close a trip. Trips closed without the slip photo will be sent back for correction, and the advance will not be settled until it is added.',rows:[['Applies to','All Chennai HO trips'],['Effective from','15 Sep 2026'],['Sent to','Chennai HO supervisors']]},
 {id:'N02',kind:'action',branch:'B01',from:'Head Office Admin',sort:'2026-09-13 18:40',title:'Exception assigned to you · Hidden kilometres',body:'55 km are unaccounted on TN 28 AQ 8890 between trips /09/018 and /09/019. Explain the gap or share the repair or fuel bill for that movement.',rows:[['Exception','X01 · High severity'],['Vehicle','TN 28 AQ 8890'],['Trip','TN28AQ8890/09/019'],['Action taken','Assigned to R. Senthil Kumar'],['Status','Open']],note:'Reply by 16 Sep so the km can be billed or written off.',link:{trip:'T10'},linkLabel:'View trip'},
 {id:'N03',kind:'action',branch:'B01',from:'Head Office Admin',sort:'2026-09-13 11:05',title:'Distance variance under review · TN 28 BC 1180',body:'Trip TN28BC1180/09/008 ran 12.8% over its fixed route. Head Office has marked it under review before billing Linde India.',rows:[['Trip','TN28BC1180/09/008'],['Fixed route','452 km'],['GPS','474 km'],['Odometer','510 km'],['Variance','12.8% · limit 5%'],['Action taken','Marked under review']],note:'Send the toll receipts for the Ongole diversion.',link:{trip:'T07'},linkLabel:'View trip'},
 {id:'N04',kind:'action',branch:'B01',from:'Head Office Admin',sort:'2026-09-12 16:30',title:'Driver request received · Anbu M.',body:'Your request to add Anbu M. as a supporting driver is with Head Office. He can be assigned to trips once the licence is verified and the request is approved.',rows:[['Driver','Anbu M.'],['Type','Supporting'],['Licence','TN2820210002209'],['Requested','12 Sep 2026 10:10'],['Status','Pending approval']]},
 {id:'N05',kind:'message',branch:'B01',priority:'Normal',from:'Head Office Admin',sort:'2026-09-11 09:00',title:'Complete September attendance',body:'2, 7 and 9 September still have unmarked drivers. Please complete them before 16 September so the monthly utilisation report is correct.',rows:[['Missing days','2, 7 and 9 Sep'],['Due by','16 Sep 2026']],link:{screen:'attMonth'},linkLabel:'Open monthly attendance'},
 {id:'N06',kind:'action',branch:'B01',from:'Head Office Admin',sort:'2026-09-10 17:20',title:'Vehicle master updated · TN 28 AR 7712',body:'TN 28 AR 7712 is now mapped to Linde India and Suguna Foods. Its driver mapping was cleared, so pick a driver when you open a trip for it.',rows:[['Vehicle','TN 28 AR 7712 · Closed body 19ft'],['Clients','Linde India, Suguna Foods'],['Driver','Not mapped'],['Action taken','Master record edited']]}
];
export const byId = (arr) => Object.fromEntries((arr || []).map(x => [x.id, x]));

export const B = byId(branches);
export const S = byId(supervisors);
export const V = byId(vehicles);
export const D = byId(drivers);
export const C = byId(clients);
export const U = byId(customers);
export const L = byId(locations);
export const R = byId(routes);
export const F = byId(bunks);
export const T = byId(trips);

export const TMS = {
  branches,
  supervisors,
  vehicles,
  drivers,
  clients,
  customers,
  locations,
  routes,
  bunks,
  trips,
  exceptions,
  gpsLog,
  users,
  permissions,
  radiusAlerts,
  supervisorNotices,
  B,
  S,
  V,
  D,
  C,
  U,
  L,
  R,
  F,
  T,
};

if (typeof window !== 'undefined') {
  window.TMS = TMS;
}

export {
  branches,
  supervisors,
  vehicles,
  drivers,
  clients,
  customers,
  locations,
  bunks,
  routes,
  trips,
  exceptions,
  gpsLog,
  users,
  permissions,
  radiusAlerts,
  supervisorNotices,
};

export default TMS;

