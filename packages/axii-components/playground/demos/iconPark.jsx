/** @jsx createElement */
import { createElement, render, reactive, ref } from 'axii'
import IconPark from '../src/iconPark/IconPark.jsx'

const icons = ["ACane","Abdominal","Abnormal","Acceleration","AcceptEmail","Acoustic","ActivitySource","Ad","AdProduct","Add","AddFour","AddItem","AddMode","AddMusic","AddOne","AddPic","AddPrint","AddSubset","AddSubtract","AddText","AddTextTwo","AddThree","AddUser","AddressBook","AdjacentItem","Adjustment","AdobeIllustrate","AdobeIndesign","AdobeLightroom","AdobePhotoshop","Afferent","AfferentTwo","AfroPick","Agreement","Aiming","AirConditioning","AirplaneWindow","AirplaneWindowOne","Airplay","Airpods","Alarm","AlarmClock","AlignBottom","AlignHorizontally","AlignLeft","AlignLeftOne","AlignRight","AlignRightOne","AlignTextBoth","AlignTextBothOne","AlignTextBottom","AlignTextBottomOne","AlignTextCenter","AlignTextCenterOne","AlignTextLeft","AlignTextLeftOne","AlignTextMiddle","AlignTextMiddleOne","AlignTextRight","AlignTextRightOne","AlignTextTop","AlignTextTopOne","AlignTop","AlignVertically","Alipay","AllApplication","AlphabeticalSorting","AlphabeticalSortingTwo","Analysis","Anchor","AnchorOne","AnchorRound","AnchorSqure","AnchorTwo","Android","AngryFace","AnguishedFace","AntiCorrosion","AperturePriority","Api","ApiApp","AppStore","AppSwitch","Apple","AppleOne","AppletClosed","Application","ApplicationEffect","ApplicationOne","ApplicationTwo","Appointment","ArcDeTriomphe","ArchersBow","AreaMap","Arena","Arithmetic","ArithmeticButtons","ArithmeticOne","ArrowCircleDown","ArrowCircleLeft","ArrowCircleRight","ArrowCircleUp","ArrowDown","ArrowKeys","ArrowLeft","ArrowLeftDown","ArrowLeftUp","ArrowRight","ArrowRightDown","ArrowRightUp","ArrowUp","AssemblyLine","Association","Asterisk","AsteriskKey","AstonishedFace","AtSign","Attention","AudioFile","Audit","AutoFocus","Average","Aviation","Avocado","AvocadoOne","Baby","BabyApp","BabyBottle","BabyCarSeat","BabyFeet","BabyMeal","BabyMobile","BabyOne","BabyPants","BabySling","BabyTaste","BachelorCap","Back","BackgroundColor","Backpack","Bad","BadOne","BadTwo","Badge","BadgeTwo","Badminton","BaggageDelay","Balance","BalanceOne","BalanceTwo","Banana","Bank","BankCard","BankCardOne","BankCardTwo","BankTransfer","Baokemeng","BarCode","Barbecue","BarberBrush","BarberClippers","Baseball","BaseballCap","Basketball","BasketballClothes","BasketballOne","BasketballStand","BatteryCharge","BatteryEmpty","BatteryFull","BatteryWorking","BatteryWorkingOne","BeachUmbrella","Beauty","BeautyInstrument","Bedside","BedsideTwo","Beer","BeerMug","Behance","BellRing","Belt","Benz","BezierCurve","Bib","BigClock","BigX","Bike","Bill","BirthdayCake","Bitcoin","BlackEight","Blade","Bless","Block","BlockEight","BlockFive","BlockFour","BlockNine","BlockOne","BlockSeven","BlockSix","BlockTen","BlockThree","BlockTwo","Blockchain","BlocksAndArrows","Bluetooth","BoltOne","Bone","Book","BookOne","BookOpen","Bookmark","BookmarkOne","Bookshelf","BoosterCarSeat","Booth","Boots","Bottle","BottleOne","BottleThree","BottleTwo","BottomBar","BottomBarOne","Bow","Bowl","BowlOne","Bowling","Box","Boxing","BoxingOne","Boy","BoyOne","BoyStroller","BoyTwo","Brain","BrakePads","Branch","BranchOne","BranchTwo","BrdigeThree","Bread","BreadMachine","BreadOne","BreastPump","BridgeOne","BridgeTwo","Briefcase","Brightness","BringForward","BringToFront","BringToFrontOne","Broadcast","BroadcastOne","BroadcastRadio","Browser","BrowserChrome","BrowserSafari","BubbleChart","Bug","BuildingFour","BuildingOne","BuildingThree","BuildingTwo","BulletMap","Bus","BusTwo","Buy","Bydesign","Bye","Bytedance","BytedanceMiniApp","CableCar","Cake","CakeFive","CakeFour","CakeOne","CakeThree","CakeTwo","Calculator","CalculatorOne","Calendar","CalendarDot","CalendarThirty","CalendarThirtyTwo","CalendarThree","Camera","CameraFive","CameraFour","CameraOne","CameraThree","CameraTwo","Camp","Candy","CannedFruit","Car","CarBattery","CardTwo","Cardioelectric","Carousel","CarouselVideo","Carrot","CastScreen","Castle","CategoryManagement","Caution","Cc","Cd","CeMarking","Cell","CenterAlignment","Certificate","ChafingDish","ChafingDishOne","Chair","ChairOne","Change","ChangeDateSort","ChargingTreasure","ChartGraph","ChartHistogram","ChartHistogramOne","ChartHistogramTwo","ChartLine","ChartLineArea","ChartPie","ChartPieOne","ChartProportion","ChartRing","ChartScatter","ChartStock","Check","CheckCorrect","CheckIn","CheckOne","CheckSmall","Checkerboard","Checklist","Cheese","ChefHat","ChefHatOne","Cherry","Chess","ChessOne","Chest","Chicken","ChickenLeg","ChildWithPacifier","ChildrenCap","ChildrenPyramid","Chili","Chimney","Chinese","ChineseOne","ChinesePavilion","Chip","ChoppingBoard","ChopsticksFork","ChristmasTree","ChurchOne","ChurchTwo","CircleFiveLine","CircleFour","CircleFourLine","CircleHouse","CircleThree","CircleTwoLine","CirclesAndTriangles","CirclesSeven","CircularConnection","Circus","City","CityGate","CityOne","Clap","Classroom","Clear","ClearFormat","Click","ClickTap","ClickTapTwo","ClickToFold","Clipboard","ClockTower","Close","CloseOne","CloseRemind","CloseSmall","CloseWifi","ClothesBriefs","ClothesCardigan","ClothesCrewNeck","ClothesDiapers","ClothesGloves","ClothesGlovesTwo","ClothesHoodie","ClothesPants","ClothesPantsShort","ClothesPantsSweat","ClothesShortSleeve","ClothesSkates","ClothesSuit","ClothesSweater","ClothesTurtleneck","ClothesWindbreaker","CloudStorage","Cloudy","Clue","CoatHanger","Cocktail","CoconutTree","Code","CodeBrackets","CodeDownload","Cola","CollapseTextInput","CollectionFiles","CollectionRecords","ColorCard","ColorFilter","Column","Comb","Come","Command","Comment","CommentOne","Comments","Commodity","Communication","CommuterBag","Compass","CompassOne","Composition","Compression","Computer","ComputerOne","ConceptSharing","Concern","Conditioner","Cone","Cones","Config","ConfoundedFace","ConfusedFace","Connect","ConnectAddressOne","ConnectAddressTwo","Connection","ConnectionArrow","ConnectionBox","ConnectionPoint","ConnectionPointTwo","Consignment","Consume","Contrast","ContrastView","ContrastViewCircle","Control","ConvergingGateway","Cook","Cooking","CookingPot","Cool","CooperativeHandshake","CoordinateSystem","Copy","CopyLink","CopyOne","Copyright","CornerDownLeft","CornerDownRight","CornerLeftDown","CornerLeftUp","CornerRightDown","CornerRightUp","CornerUpLeft","CornerUpRight","Coronavirus","Correct","CosmeticBrush","Coupon","Court","Cpu","Crab","CreationDateSort","Creative","Credit","Crib","Croissant","CrossRing","CrossRingTwo","Crown","CrownThree","CrownTwo","Cruise","CryingBaby","Cube","CubeFive","CubeFour","CubeThree","CubeTwo","Cup","CupFour","CupOne","Curling","Currency","CurveAdjustment","Customer","Cutting","CuttingOne","Cuvette","Cycle","CycleArrow","CycleMovement","CycleOne","Cylinder","DarkMode","Dashboard","DashboardCar","DashboardOne","DashboardTwo","Data","DataAll","DataArrival","DataDisplay","DataFile","DataFour","DataLock","DataNull","DataOne","DataScreen","DataServer","DataSheet","DataSwitching","DataThree","DataTwo","DataUser","DatabaseAlert","DatabaseCode","DatabaseConfig","DatabaseDownload","DatabaseEnter","DatabaseFail","DatabaseFirst","DatabaseForbid","DatabaseLock","DatabaseNetwork","DatabaseNetworkPoint","DatabasePoint","DatabasePosition","DatabasePower","DatabaseProportion","DatabaseSearch","DatabaseSetting","DatabaseSuccess","DatabaseSync","DatabaseTime","DateComesBack","DeadlineSort","DeathStar","Deeplink","DegreeHat","Delete","DeleteKey","DeleteMode","DeleteOne","DeleteThemes","DeleteThree","DeleteTwo","Delivery","Deposit","Descend","DeskLamp","Detection","Devices","Diamond","DiamondNecklace","DiamondOne","DiamondRing","DiamondThree","DiamondTwo","Diamonds","Dianziqian","DiapersOne","DifferenceSet","DigitalWatches","Direction","DirectionAdjustment","DirectionAdjustmentThree","DirectionAdjustmentTwo","DisappointedFace","DiscoveryIndex","Disk","DiskOne","DiskTwo","Dislike","DislikeTwo","Display","Distortion","DistraughtFace","DistributeHorizontally","DistributeVertically","DividingLine","Diving","DivingBottle","DivingSuit","Division","DizzyFace","DocAdd","DocDetail","DocFail","DocSearch","DocSearchTwo","DocSuccess","DocumentFolder","Dollar","Dome","DomeLight","DoneAll","Dongchedi","DoorHandle","Dot","DoubleBed","DoubleDown","DoubleLeft","DoubleRight","DoubleUp","Doughnut","Down","DownC","DownOne","DownSmall","DownSquare","DownTwo","Download","DownloadFour","DownloadOne","DownloadThree","DownloadTwo","Drag","Dribble","Drink","Drone","DroneOne","DropDownList","Dropbox","Drumstick","Dubai","Dumbbell","Dvi","Earth","Easy","Edit","EditMovie","EditName","EditOne","EditTwo","Editor","Effects","Egg","EggOne","Eggplant","EiffelTower","EightKey","ElectricIron","ElectricWave","Electrocardiogram","ElectronicDoorLock","ElectronicLocksClose","ElectronicLocksOpen","ElectronicPen","Elevator","EmailBlock","EmailDelect","EmailDown","EmailFail","EmailLock","EmailPush","EmailSearch","EmailSecurity","EmailSuccessfully","EmotionHappy","EmotionUnhappy","Empty","EndTimeSort","Endless","Endocrine","EndpointDisplacement","EndpointFlat","EndpointRound","EndpointSquare","EnergySocket","English","EnglishMustache","Enquire","EnterKey","EnterKeyOne","EnterTheKeyboard","Entertainment","Envelope","EnvelopeOne","EqualRatio","Equalizer","Erase","Error","ErrorPrompt","Escalators","EthernetOff","EthernetOn","EveryUser","Excel","ExcelOne","Exchange","ExchangeFour","ExchangeOne","ExchangeThree","ExchangeTwo","ExcludeSelection","ExclusiveGateway","ExpandDown","ExpandDownOne","ExpandLeft","ExpandLeftAndRight","ExpandRight","ExpandTextInput","ExpandUp","Expenses","ExpensesOne","Experiment","ExperimentOne","Export","ExpressDelivery","ExpressionlessFace","Extend","ExternalTransmission","Eyebrow","Eyes","FEightKey","FFiveKey","FFourKey","FNKey","FNineKey","FOneKey","FSevenKey","FSixKey","FThreeKey","FTwoKey","FZeroKey","FacePowder","FaceRecognition","FaceWithSmilingOpenEyes","FaceWithoutMouth","Facebook","FacebookOne","Facetime","Faceu","FacialCleanser","FactoryBuilding","Family","Fan","Fanqiexiaoshuo","Feelgood","FeelgoodOne","Feiyu","Female","FenceOne","FenceTwo","FerrisWheel","Figma","FigmaComponent","FigmaFlattenSelection","FigmaMask","FigmaResetInstance","FileAddition","FileAdditionOne","FileCabinet","FileCode","FileCodeOne","FileCollection","FileCollectionOne","FileConversion","FileConversionOne","FileDate","FileDateOne","FileDisplay","FileDisplayOne","FileDoc","FileEditing","FileEditingOne","FileExcel","FileFailed","FileFailedOne","FileFocus","FileFocusOne","FileGif","FileHash","FileHashOne","FileHiding","FileHidingOne","FileJpg","FileLock","FileLockOne","FileMusic","FileMusicOne","FilePdf","FilePdfOne","FilePpt","FileProtection","FileProtectionOne","FileQuality","FileQualityOne","FileQuestion","FileRemoval","FileRemovalOne","FileSearch","FileSearchOne","FileSearchTwo","FileSettings","FileSettingsOne","FileStaff","FileStaffOne","FileSuccess","FileSuccessOne","FileText","FileTextOne","FileTips","FileTipsOne","FileTxt","FileTxtOne","FileWithdrawal","FileWithdrawalOne","FileWord","FileZip","Fill","Filter","FilterOne","Finance","Financing","FinancingOne","FinancingTwo","Find","FindOne","Fingernail","Fingerprint","FingerprintThree","FingerprintTwo","Fire","FireExtinguisher","FireExtinguisherOne","FireTwo","Fireworks","First","Fish","Fishing","Fist","Five","FiveEllipses","FiveFive","FiveKey","FiveStarBadge","Flag","FlashPayment","Flashlamp","Flashlight","Flask","FlightAirflow","FlightSafety","FlipCamera","FlipHorizontally","FlipVertically","Flirt","Float","Fm","Focus","FocusOne","Fog","FoldUpOne","Folder","FolderClose","FolderDownload","FolderMinus","FolderOpen","FolderPlus","FolderUpload","FollowUpDateSort","FontSearch","FontSize","FontSizeTwo","Football","Forbid","Fork","ForkSpoon","Form","FormOne","Format","FormatBrush","Formula","FoundationMakeup","Four","FourArrows","FourFour","FourKey","FourLeaves","FourPointConnection","FourRoundPointConnection","Foursquare","FreezeColumn","FreezeLine","FreezingLineColumn","FrenchFries","FriendsCircle","FrowningFaceWhitOpenMouth","FullDressLonguette","FullScreen","FullScreenOne","FullScreenPlay","FullScreenTwo","FullSelection","Fullwidth","Funds","FutureBuildOne","FutureBuildThree","FutureBuildTwo","Game","GameConsole","GameConsoleOne","GameEmoji","GameHandle","GamePs","GameThree","GameTwo","Garage","Garlic","Gastrointestinal","Gate","GateMachine","GeneralBranch","GeometricFlowers","Germs","Ghost","Gift","GiftBox","Girl","GirlOne","GirlTwo","Github","GithubOne","Gitlab","Glasses","GlassesOne","Globe","Glove","GoEnd","GoOn","GoStart","Goblet","GobletCracking","GobletFull","GobletOne","GoldMedal","GoldMedalTwo","GolfCourse","Good","GoodOne","GoodTwo","Google","GoogleAds","Gopro","Gps","GraphicDesign","GraphicDesignTwo","GraphicStitching","GraphicStitchingFour","GraphicStitchingThree","GreatWall","GreenHouse","GreenNewEnergy","GridFour","GridNine","GridSixteen","GridThree","GridTwo","GrimacingFace","GrinningFace","GrinningFaceWithOpenMouth","GrinningFaceWithSquintingEyes","GrinningFaceWithTightlyClosedEyes","GrinningFaceWithTightlyClosedEyesOpenMouth","Group","GuideBoard","Gymnastics","GymnasticsOne","H","H1","H2","H3","HairBrush","HairClip","HairDryer","HairDryerOne","Halo","Hamburger","HamburgerButton","HamburgerOne","HammerAndAnvil","HandCream","HandDown","HandDrag","HandLeft","HandPaintedPlate","HandRight","HandUp","Handbag","Handheld","HandleA","HandleB","HandleC","HandleDown","HandleLeft","HandleRight","HandleRound","HandleSquare","HandleTriangle","HandleUp","HandleX","HandleY","HandleZ","Hands","Handwashing","HandwashingFluid","HanfuChineseStyle","Hanger","HangerOne","HangerTwo","HardDisk","HardDiskOne","Harm","HashtagKey","Hat","Hdd","HdmiCable","HdmiConnector","HeadphoneSound","Headset","HeadsetOne","HeadsetTwo","Headwear","Health","HealthProducts","HealthyRecognition","Heart","HeartBallon","Heartbeat","HeaterResistor","HeavyMetal","HeavyRain","Helmet","HelmetOne","Help","Helpcenter","HexagonOne","HexagonStrip","Hexagonal","Hi","HighHeeledShoes","HighLight","Histogram","History","HistoryQuery","Hockey","Hold","HoldInterface","HoldSeeds","HoldingHands","HolySword","Home","HomeTwo","Homestay","Honey","HoneyOne","Hospital","HospitalTwo","HotAirBalloon","HotPot","HotPotOne","Hotel","HotelDoNotClean","HotelPleaseClean","Hourglass","HourglassFull","HourglassNull","HtmlFive","HuntingGear","Huoshanzhibo","IMac","Icecream","IcecreamFive","IcecreamFour","IcecreamOne","IcecreamThree","IcecreamTwo","IdCard","IdCardH","IdCardV","ImageFiles","Imbalance","InFlight","Inbox","InboxDownloadR","InboxIn","InboxOut","InboxR","InboxSuccess","InboxSuccessR","InboxUploadR","InclusiveGateway","Income","IncomeOne","Incoming","Increase","IncreaseTheScale","IndentLeft","IndentRight","IndexFinger","InductionLock","IndustrialScales","Info","Injection","Inline","InsertCard","InsertTable","Inspection","Instagram","InstagramOne","Install","Instruction","Intercom","IntermediateMode","InternalData","InternalExpansion","InternalReduction","InternalTransmission","International","IntersectSelection","Intersection","InvalidFiles","InvertCamera","IosFaceRecognition","Ipad","IpadOne","Iphone","Ipo","Iron","IronDisable","IronThree","IronTwo","Iwatch","IwatchOne","IwatchTwo","Jewelry","Jinritoutiao","Journey","Joystick","Juice","KagiMap","Kettle","KettleOne","Key","Keyboard","KeyboardOne","Keyhole","Keyline","KitchenKnife","KnifeFork","Kungfu","Label","Ladder","Lamp","LandSurveying","Landscape","Laptop","LaptopComputer","Lark","LarkOne","LatticePattern","Layers","LayoutFive","LayoutFour","LayoutOne","LayoutThree","LayoutTwo","Leaf","Leaves","LedDiode","Left","LeftAlignment","LeftBar","LeftC","LeftExpand","LeftOne","LeftSmall","LeftSmallDown","LeftSmallUp","LeftSquare","LeftTwo","Lemon","LensAlignment","Level","LevelAdjustment","LevelEightTitle","LevelFiveTitle","LevelFourTitle","LevelNineTitle","LevelSevenTitle","LevelSixTitle","Lifebuoy","Light","LightHouse","LightMember","LightRain","Lightning","Like","Lincoln","Link","LinkBreak","LinkCloud","LinkCloudFaild","LinkCloudSucess","LinkFour","LinkIn","LinkInterrupt","LinkLeft","LinkOne","LinkOut","LinkRight","LinkThree","LinkTwo","LipGloss","LipTattoo","Lipstick","LipstickOne","Liqueur","List","ListAdd","ListAlphabet","ListBottom","ListCheckbox","ListFail","ListMiddle","ListNumbers","ListOne","ListSuccess","ListTop","ListTwo","ListView","Loading","LoadingOne","LoadingThree","LoadingTwo","Local","LocalPin","LocalTwo","Lock","Log","Login","Logout","Lollipop","LoopOnce","Lotion","LoudlyCryingFace","LoudlyCryingFaceWhitOpenMouth","Luggage","Luminous","Lung","MacFinder","MacadamiaNut","Magic","MagicHat","MagicWand","Magnet","Mail","MailDownload","MailEdit","MailOpen","MailPackage","MailReview","MailUnpacking","MaillOne","Makeups","Male","MallBag","ManualGear","ManyToMany","MapDistance","MapDraw","MapRoad","MapRoadTwo","MapTwo","Margin","MarginOne","Mark","Market","MarketAnalysis","Mascara","Mask","MaskOne","MaskTwo","MaslowPyramids","MassageChair","MassageChairOne","MassageTable","Master","Material","MaterialThree","MaterialTwo","Maximum","Maya","MayuraGesture","Me","MeasuringCup","Mediaeditor","MedicalBox","MedicalFiles","MedicationTime","MedicineBottle","Memory","MemoryCard","MemoryOne","MenJacket","MenuFold","MenuFoldOne","MenuUnfold","MenuUnfoldOne","Merge","MergeCells","Message","MessageEmoji","MessageFailed","MessageOne","MessagePrivacy","MessageSearch","MessageSecurity","MessageSent","MessageSuccess","MessageUnread","Messages","MessagesOne","MicroSd","MicroSlrCamera","Microphone","MicrophoneOne","Microscope","MicroscopeOne","MicrowaveOven","Microwaves","MiddleFinger","Milk","MilkOne","Min","MindMapping","MindmapList","MindmapMap","MiniSdCard","Minus","MinusTheBottom","MinusTheTop","Mirror","MirrorOne","MirrorTwo","MisalignedSemicircle","Mitsubishi","Modify","ModifyTwo","Monitor","MonitorCamera","MonitorOff","MonitorOne","MonitorTwo","MonumentOne","MonumentTwo","Moon","More","MoreApp","MoreFour","MoreOne","MoreThree","MoreTwo","Mosaic","Mouse","MouseOne","Mouth","Move","MoveIn","MoveInOne","Movie","MovieBoard","MultiCircular","MultiFunctionKnife","MultiPictureCarousel","MultiRectangle","MultiRing","MultiTriangular","MultiTriangularFour","MultiTriangularThree","MultiTriangularTwo","Multicast","MultilayerSphere","Muscle","MuseumOne","MuseumTwo","Music","MusicCd","MusicList","MusicMenu","MusicOne","MusicRhythm","Mute","NailPolish","NailPolishOne","Nasal","NaturalMode","Navigation","Necktie","NegativeDynamics","NestedArrows","Nests","NetworkDrive","NetworkTree","Neural","NeutralFace","Newlybuild","NewspaperFolding","Next","NineKey","NinePointsConnected","NintendoSwitch","Nmr","NodeFlat","NodeRound","NodeSquare","Noodles","Notebook","NotebookAndPen","NotebookOne","Notepad","Notes","NuclearPlant","Nut","Nutrition","Oceanengine","Octagon","OffScreen","OffScreenOne","OffScreenTwo","OilIndustry","Okay","One","OneKey","OneOne","OneThirdRotation","OneToMany","OneToOne","Onesies","OnlineMeeting","Open","OpenAnAccount","OpenDoor","OpenOne","Optimize","Optional","Orange","OrangeOne","OrangeStation","Order","OrderedList","Orthopedic","Oscillator","Other","Outbound","Outdoor","Outgoing","OvalLove","OvalLoveTwo","OvalOne","Oven","OvenTray","OverallReduction","Pacifier","Pad","Page","PageTemplate","Pagoda","Paint","PaintedEggshell","PaintedScreen","Palace","Palm","Pangle","PanoramaHorizontal","Panties","PaperMoney","PaperMoneyTwo","PaperShip","Paperclip","Parabola","Parachute","ParagraphAlphabet","ParagraphBreak","ParagraphBreakTwo","ParagraphCut","ParagraphRectangle","ParagraphRound","ParagraphTriangle","ParagraphUnfold","ParallelGateway","Parallelogram","ParentingBook","Parking","PartyBalloon","Passport","PassportOne","Pause","PauseOne","PayCode","PayCodeOne","PayCodeTwo","PaymentMethod","Paypal","Peach","Pear","PearlOfTheOrient","Peas","Pennant","PentagonOne","People","PeopleBottom","PeopleBottomCard","PeopleDelete","PeopleDeleteOne","PeopleDownload","PeopleLeft","PeopleMinus","PeopleMinusOne","PeoplePlus","PeoplePlusOne","PeopleRight","PeopleSafe","PeopleSafeOne","PeopleSearch","PeopleSearchOne","PeopleSpeak","PeopleTop","PeopleTopCard","PeopleUnknown","PeopleUpload","Peoples","PeoplesTwo","Percentage","Performance","Perfume","PerfumerBottle","Period","Permissions","PersonalCollection","PersonalPrivacy","Perspective","Pesticide","Petrol","Phone","PhoneBooth","PhoneCall","PhoneIncoming","PhoneIncomingOne","PhoneMissed","PhoneOff","PhoneOne","PhoneOutgoing","PhoneOutgoingOne","PhoneTelephone","PhoneTwo","PhoneVideoCall","Phonograph","Photograph","Piano","Pic","PicOne","Picture","PictureOne","Pie","PieFive","PieFour","PieOne","PieSeven","PieSix","PieThree","PieTwo","Pills","Pineapple","Pinwheel","PivotTable","Plan","Planet","PlasticSurgery","Platte","Play","PlayBasketball","PlayCycle","PlayOnce","PlayOne","PlayTwo","PlayVolleyball","PlayWrong","PlaybackProgress","Plug","PlugOne","Plus","PlusCross","Point","PointOut","PokeballOne","Poker","Popcorn","PopcornOne","PositiveDynamics","Pot","Potentiometer","Pound","PoundSign","PoutingFace","Powder","Power","PowerSupply","PowerSupplyOne","Powerpoint","Ppt","PregnantWomen","Preschool","Prescription","Press","PreviewClose","PreviewCloseOne","PreviewOpen","Printer","PrinterOne","PrinterTwo","Prison","ProcessLine","Projector","ProjectorOne","ProjectorThree","ProjectorTwo","ProportionalScaling","Protect","Protection","PublicToilet","PullDoor","PullRequests","Pumpkin","PureNatural","PushDoor","Puzzle","Pyramid","PyramidOne","QingniaoClue","Qiyehao","QuadrangularPyramid","Quadrilateral","Quote","Radar","RadarChart","RadarTwo","Radiation","Radio","RadioNanny","RadioOne","Radish","RadishOne","Railway","Ranking","RankingList","Rattle","RattleOne","Razor","Receive","Receiver","RecentViewsSort","Record","RecordDisc","RecordPlayer","Rectangle","RectangleOne","RectangleSmall","RectangleTear","RectangleX","RectangularCircularConnection","RectangularCircularSeparation","RectangularVertebra","RecycleBin","Recycling","RecyclingPool","RedCross","RedEnvelope","RedEnvelopes","Redo","Reduce","ReduceDecimalPlaces","ReduceOne","ReduceTwo","ReduceUser","Reel","Refraction","Refresh","RefreshOne","Refrigerator","Reject","RelationalGraph","RelievedFace","Reload","Remind","RemindDisable","RemoteControl","RemoteControlOne","Renal","Renault","Repair","ReplayFive","ReplayMusic","Report","Repositioning","Resistor","Respect","Resting","RetroBag","Return","ReverseLens","ReverseOperationIn","ReverseOperationOut","ReverseRotation","Rice","Riding","RidingOne","Right","RightAngle","RightBar","RightC","RightExpand","RightOne","RightRun","RightSmall","RightSmallDown","RightSmallUp","RightSquare","RightTwo","RightUser","Ring","RingOne","Rings","Ripple","Road","RoadCone","RoadSign","RoadSignBoth","Robot","RobotOne","RobotTwo","Rock","RockGesture","Rocket","RocketOne","RockingHorse","Rollerskates","Romper","RopeSkipping","RopeSkippingOne","Rotate","RotateOne","RotatingAdd","RotatingForward","Rotation","RotationHorizontal","RotationVertical","Round","RoundCaliper","RoundDistortion","RoundMask","RoundSocket","RoundTrip","Router","RouterOne","RowHeight","Rowing","RsMale","Rss","Rugby","RugbyOne","Ruler","RulerOne","RunLeft","STurnDown","STurnLeft","STurnRight","STurnUp","Sailboat","Sailing","SalesReport","Sandals","Sandstorm","Sandwich","SandwichOne","Sapling","Save","SaveOne","Scallion","Scan","ScanCode","ScanSetting","Scanning","ScanningTwo","ScatterAlignment","Schedule","School","Scissors","Scoreboard","ScreenRotation","Screenshot","ScreenshotOne","ScreenshotTwo","Sd","SdCard","Seal","Search","Security","SecurityStall","Selected","SelectedFocus","Selfie","Send","SendBackward","SendEmail","SendOne","SendToBack","SentToBack","Seo","SeoFolder","Server","SetOff","Setting","SettingConfig","SettingOne","SettingThree","SettingTwo","SevenKey","Shade","Shake","Share","ShareOne","ShareSys","ShareThree","ShareTwo","Shaver","ShaverOne","Shaving","Shield","ShieldAdd","Ship","Shop","Shopping","ShoppingBag","ShoppingCart","ShoppingCartAdd","ShoppingCartDel","ShoppingCartOne","ShoppingMall","ShortSkirt","Shorts","Shovel","ShovelOne","ShowerHead","Shrimp","Shuffle","ShuffleOne","ShutterPriority","Signal","SignalOne","SignalStrength","SignalTower","SignalTowerOne","Sim","SimCard","SingleBed","Sinusoid","SippyCup","Six","SixCircularConnection","SixKey","SixPoints","Skate","Skates","Skating","Sketch","SkiingNordic","Skull","Slave","Sleaves","Sleep","SleepOne","Slide","SlideTwo","SlidingHorizontal","SlidingVertical","SlightlyFrowningFaceWhitOpenMouth","SlightlySmilingFace","Slippers","SlippersOne","SlyFaceWhitSmile","SmartOptimization","SmilingFace","SmilingFaceWithSquintingEyes","Snacks","Snowflake","SoapBubble","Soccer","SoccerOne","Socks","Sofa","SofaTwo","Softball","SolarEnergy","SolarEnergyOne","SolidStateDisk","SorcererHat","Sort","SortAmountDown","SortAmountUp","SortFour","SortOne","SortThree","SortTwo","Sound","SoundOne","SoundWave","SoybeanMilkMaker","SpaCandle","SpaceColony","Speaker","SpeakerOne","Speed","SpeedOne","Sperm","Sphere","SpiderMan","Spikedshoes","SpinningTop","Split","SplitBranch","SplitCells","SplitTurnDownLeft","SplitTurnDownRight","Spoon","Sport","Square","SquareSmall","Ssd","StackLight","Stamp","Stapler","Star","StarOne","StartTimeSort","SteeringWheel","Steoller","StereoNesting","StereoOne","StereoPerspective","Stethoscope","Stickers","StockMarket","Stopwatch","StopwatchStart","StorageCardOne","StorageCardTwo","StraightRazor","StrawHat","Stretching","Strikethrough","Strongbox","SubtractSelection","SubtractSelectionOne","Subway","Success","Sum","Sun","SunHat","SunOne","Sunbath","Sunny","Sunrise","Sunshade","SurprisedFaceWithOpenBigMouth","SurprisedFaceWithOpenMouth","SurveillanceCameras","SurveillanceCamerasOne","SurveillanceCamerasTwo","Swallow","Sweater","SwimmingPool","SwimmingRing","Swimsuit","Swing","Swipe","Switch","SwitchButton","SwitchContrast","SwitchNintendo","SwitchOne","SwitchThemes","SwitchTrack","SwitchingDone","Symbol","SymbolDoubleX","Symmetry","Sync","System","TShirt","Table","TableFile","TableLamp","TableReport","Tabletennis","Tag","TagOne","Tailoring","TailoringTwo","TajMahal","TakeOff","Taobao","Tape","Target","TargetOne","TargetTwo","Taxi","Tea","TeaDrink","Teapot","Teeth","Telegram","Telescope","TencentQq","Tennis","Tent","TentBanner","Terminal","TerminationFile","TestTube","Text","TextBold","TextItalic","TextMessage","TextRecognition","TextRotationDown","TextRotationLeft","TextRotationNone","TextRotationUp","TextStyle","TextStyleOne","TextUnderline","TextWrapOverflow","TextWrapTruncation","Texture","TextureTwo","TheSingleShoulderBag","Theater","Theme","Thermometer","ThermosCup","Thin","ThinkingProblem","Three","ThreeDGlasses","ThreeHexagons","ThreeKey","ThreeSlashes","ThreeThree","ThreeTriangles","ThumbsDown","ThumbsUp","Thunderbolt","Thunderstorm","ThunderstormOne","Ticket","TicketOne","TicketsChecked","TicketsOne","TicketsTwo","Tiktok","Time","TimedMail","Timeline","Timer","Tips","TipsOne","TireSwing","TitleLevel","ToBottom","ToBottomOne","ToLeft","ToRight","ToTop","ToTopOne","Toilet","Tomato","Tool","TopBar","Topbuzz","Topic","TopicDiscussion","Torch","TourBus","Towel","Tower","TowerOfBabel","TowerOfPisa","Toxins","Trace","Trademark","TraditionalChineseMedicine","Transaction","TransactionOrder","Transfer","TransferData","Transform","Translate","Translation","Transport","Transporter","Trapezoid","Tray","Treadmill","TreadmillOne","TreasureChest","Tree","TreeDiagram","TreeList","Trend","TrendTwo","TrendingDown","TrendingUp","Triangle","TriangleRoundRectangle","TriangleRuler","TriangularPyramid","Trophy","TrousersBellBottoms","Truck","Trumpet","Trunk","Tuchong","Tumblr","Turkey","TurnAround","TurnOffBluetooth","TurnOn","Tv","TvOne","Twitter","Two","TwoDimensionalCode","TwoDimensionalCodeOne","TwoDimensionalCodeTwo","TwoEllipses","TwoFingers","TwoHands","TwoKey","TwoSemicircles","TwoTriangles","TwoTrianglesTwo","TwoTwo","TypeDrive","UDisk","UTurnDown","UTurnLeft","UTurnRight","UTurnUp","Ulikecam","Umbrella","UmbrellaOne","UmbrellaTwo","Undo","Ungroup","Unicast","UnionSelection","Universal","Unlike","Unlink","Unlock","UnorderedList","Up","UpAndDown","UpC","UpOne","UpSmall","UpSquare","UpTwo","UpdateRotation","Upload","UploadLogs","UploadOne","UploadThree","UploadTwo","UpsideDownFace","Usb","UsbMemoryStick","UsbMicroOne","UsbMicroTwo","UsbOne","UsbTypeC","User","UserBusiness","UserPositioning","UserToUserTransmission","Uterus","VacuumCleaner","VegetableBasket","Vegetables","VerticalTimeline","Vest","Vial","ViciaFaba","Video","VideoFile","VideoOne","VideoTwo","Videocamera","VideocameraOne","Viencharts","ViewGridCard","ViewGridDetail","ViewGridList","ViewList","Viewfinder","Vigo","Vip","VirtualRealityGlasses","Voice","VoiceInput","VoiceMessage","VoiceOff","VoiceOne","Voicemail","Volkswagen","Volleyball","VolumeDown","VolumeMute","VolumeNotice","VolumeSmall","VolumeUp","VrGlasses","Wallet","WalletOne","WalletTwo","Warehousing","WashingMachine","WashingMachineOne","Watch","WatchOne","Water","WaterLevel","WaterNo","WaterRate","WaterRateTwo","WaterfallsH","WaterfallsV","Watermelon","WatermelonOne","Waterpolo","WaterpoloOne","Waves","WavesLeft","WavesRight","WearyFace","Webcam","Wechat","Weibo","Weight","Weightlifting","WeixinCardsOffers","WeixinFavorites","WeixinGames","WeixinMarket","WeixinMiniApp","WeixinPeopleNearby","WeixinScan","WeixinSearch","WeixinShake","WeixinTopStories","Wheelchair","Whirlwind","Whistling","WholeSiteAccelerator","Wifi","WindTurbine","Windmill","WindmillOne","WindmillTwo","Windows","WingsuitFlying","WinkingFace","WinkingFaceWithOpenEyes","Woman","WomenCoat","WoolenHat","Word","Workbench","Worker","World","WorriedFace","Write","WritingFluently","WrongUser","Xiaodu","XiaoduHome","Xigua","Xingfuli","Xingtu","Yep","Youtobe","Youtube","ZeroKey","Zijinyunying","Zip","Zoom","ZoomIn","ZoomInternal","ZoomOut","setConfig"]

function App() {

  return (
    <div>
      {icons.map(iconType => {
        return <iconWrapper inline inline-width-60px inline-overflow-x-hidden inline-margin-bottom-30px nline-margin-left-10px>
          <IconPark type={iconType} size={2}/>
          <iconName block>{iconType}</iconName>
        </iconWrapper>
      })}
    </div>

  )
}

render(<App />, document.getElementById('root'))