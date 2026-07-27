-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: sandig
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `sandig`
--

/*!40000 DROP DATABASE IF EXISTS `sandig`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `sandig` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `sandig`;

--
-- Table structure for table `assessments`
--

DROP TABLE IF EXISTS `assessments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assessments` (
  `id` varchar(191) NOT NULL,
  `pwdId` varchar(191) NOT NULL,
  `date` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `assessedById` varchar(191) NOT NULL,
  `healthConcern` varchar(191) NOT NULL DEFAULT '',
  `checkupAttendance` varchar(191) NOT NULL DEFAULT 'Regular',
  `therapyAttendance` varchar(191) NOT NULL DEFAULT 'Regular',
  `medicationAccess` varchar(191) NOT NULL DEFAULT 'Accessible',
  `deviceType` varchar(191) NOT NULL DEFAULT '',
  `deviceCondition` varchar(191) NOT NULL DEFAULT 'Good',
  `needsRepair` tinyint(1) NOT NULL DEFAULT 0,
  `needsReplacement` tinyint(1) NOT NULL DEFAULT 0,
  `urgentNeed` varchar(191) NOT NULL DEFAULT '',
  `remarks` varchar(191) NOT NULL DEFAULT '',
  `recommendedAction` varchar(191) NOT NULL DEFAULT '',
  `unresolvedHealthNeed` tinyint(1) NOT NULL DEFAULT 0,
  `pendingReferral` tinyint(1) NOT NULL DEFAULT 0,
  `missedCheckup` tinyint(1) NOT NULL DEFAULT 0,
  `medicationConcern` tinyint(1) NOT NULL DEFAULT 0,
  `treatmentTherapyNeed` tinyint(1) NOT NULL DEFAULT 0,
  `urgentMedicalCondition` tinyint(1) NOT NULL DEFAULT 0,
  `ruleScore` int(11) NOT NULL,
  `ruleLevel` enum('Low Risk','Moderate Risk','High Risk') NOT NULL,
  `ruleVersion` varchar(191) NOT NULL DEFAULT 'rule-v1',
  `triggersImmediateReview` tinyint(1) NOT NULL DEFAULT 0,
  `aiPredicted` enum('Low Risk','Moderate Risk','High Risk') DEFAULT NULL,
  `aiProbLow` double DEFAULT NULL,
  `aiProbModerate` double DEFAULT NULL,
  `aiProbHigh` double DEFAULT NULL,
  `aiModelVersion` varchar(191) DEFAULT NULL,
  `aiPredictedAt` datetime(3) DEFAULT NULL,
  `confirmedLevel` enum('Low Risk','Moderate Risk','High Risk') DEFAULT NULL,
  `confirmedById` varchar(191) DEFAULT NULL,
  `confirmedAt` datetime(3) DEFAULT NULL,
  `overridden` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assessments_pwdId_date_idx` (`pwdId`,`date`),
  KEY `assessments_assessedById_fkey` (`assessedById`),
  KEY `assessments_confirmedById_fkey` (`confirmedById`),
  CONSTRAINT `assessments_assessedById_fkey` FOREIGN KEY (`assessedById`) REFERENCES `system_users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `assessments_confirmedById_fkey` FOREIGN KEY (`confirmedById`) REFERENCES `system_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `assessments_pwdId_fkey` FOREIGN KEY (`pwdId`) REFERENCES `pwd_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assessments`
--

LOCK TABLES `assessments` WRITE;
/*!40000 ALTER TABLE `assessments` DISABLE KEYS */;
INSERT INTO `assessments` VALUES ('cms3gnzcz000a7ntszf9yh3vy','cms3gnzbs00017ntsp19gt97t','2026-05-10 00:00:00.000','cms3gnzbk00007ntsu5848z9l','Recurring back pain and pressure sores','Irregular','None','Difficult — no transport','Wheelchair','Worn',1,0,'Wheelchair repair, medical check-up','PWD has not had a check-up in 8 months. Caregiver is aging.','Refer to Barangay Health Center',1,1,1,1,1,0,10,'High Risk','rule-v1',0,'High Risk',0.03,0.15,0.82,'rf-seed-0.1-provisional','2026-05-10 00:00:00.000','High Risk','cms3gnzbk00007ntsu5848z9l','2026-05-11 00:00:00.000',0),('cms3gnzdi000e7nts74fljzim','cms3gnzcb00047ntswvpb09xv','2026-03-15 00:00:00.000','cms3gnzbk00007ntsu5848z9l','Hypertension, no medication','None in past year','None','Cannot afford','Hearing Aid','Broken',0,1,'Medical assistance, hearing aid replacement','Lives alone. Urgent situation — no support network.','Immediate referral to Hospital — urgent medical condition',1,1,1,1,0,1,12,'High Risk','rule-v1',1,'High Risk',0.01,0.05,0.94,'rf-seed-0.1-provisional','2026-03-15 00:00:00.000','High Risk','cms3gnzbk00007ntsu5848z9l','2026-03-16 00:00:00.000',0),('cms3gnze1000i7nts0r4q77j0','cms3gnzcp00077ntsx96z3nd8','2026-05-30 00:00:00.000','cms3gnzbk00007ntsu5848z9l','Therapy sessions discontinued','Irregular','None','Accessible','None','N/A',0,0,'Psychosocial therapy follow-up','Missed two consecutive health assessments.','Coordinate with BHC for therapy session',1,1,1,0,1,0,8,'Moderate Risk','rule-v1',0,'High Risk',0.05,0.34,0.61,'rf-seed-0.1-provisional','2026-05-30 00:00:00.000',NULL,NULL,NULL,NULL),('cms3gnzeg000m7nts4mhi5cvv','cms3gnzbz00027nts2of2ijja','2026-04-20 00:00:00.000','cms3gnzbk00007ntsu5848z9l','Routine consultation not completed','Irregular','N/A','Accessible','White Cane','Good',0,0,'Routine medical consultation','Treatment not yet received following last assessment recommendation.','Refer to Barangay Health Center',0,0,1,0,1,0,4,'Low Risk','rule-v1',0,'Low Risk',0.58,0.34,0.08,'rf-seed-0.1-provisional','2026-04-20 00:00:00.000','Low Risk','cms3gnzbk00007ntsu5848z9l','2026-04-21 00:00:00.000',0);
/*!40000 ALTER TABLE `assessments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `at_risk_cases`
--

DROP TABLE IF EXISTS `at_risk_cases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `at_risk_cases` (
  `id` varchar(191) NOT NULL,
  `pwdId` varchar(191) NOT NULL,
  `assessmentId` varchar(191) NOT NULL,
  `flagReason` varchar(191) NOT NULL,
  `dateFlagged` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `followUpStatus` enum('Scheduled','Completed','Overdue','Missed') NOT NULL DEFAULT 'Scheduled',
  `status` enum('Open','Reviewed','Closed') NOT NULL DEFAULT 'Open',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `at_risk_cases_pwdId_key` (`pwdId`),
  UNIQUE KEY `at_risk_cases_assessmentId_key` (`assessmentId`),
  CONSTRAINT `at_risk_cases_assessmentId_fkey` FOREIGN KEY (`assessmentId`) REFERENCES `assessments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `at_risk_cases_pwdId_fkey` FOREIGN KEY (`pwdId`) REFERENCES `pwd_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `at_risk_cases`
--

LOCK TABLES `at_risk_cases` WRITE;
/*!40000 ALTER TABLE `at_risk_cases` DISABLE KEYS */;
INSERT INTO `at_risk_cases` VALUES ('cms3gnzd6000c7nts8nstbbia','cms3gnzbs00017ntsp19gt97t','cms3gnzcz000a7ntszf9yh3vy','Missed scheduled checkup; medication not being taken regularly; therapy not yet started','2026-05-10 00:00:00.000','Scheduled','Open','2026-07-27 16:48:26.827','2026-07-27 16:48:26.827'),('cms3gnzdn000g7ntsjclla8m3','cms3gnzcb00047ntswvpb09xv','cms3gnzdi000e7nts74fljzim','Urgent medical condition reported; unresolved medication concern; pending Barangay Health Center referral','2026-03-15 00:00:00.000','Overdue','Open','2026-07-27 16:48:26.844','2026-07-27 16:48:26.844'),('cms3gnze6000k7ntsqm90kiai','cms3gnzcp00077ntsx96z3nd8','cms3gnze1000i7nts0r4q77j0','Therapy follow-up overdue; treatment not yet received; missed two consecutive health assessments','2026-05-30 00:00:00.000','Missed','Open','2026-07-27 16:48:26.862','2026-07-27 16:48:26.862'),('cms3gnzem000o7ntsu7wtppgh','cms3gnzbz00027nts2of2ijja','cms3gnzeg000m7nts4mhi5cvv','Missed scheduled checkup; treatment not yet received following last assessment recommendation','2026-04-20 00:00:00.000','Completed','Reviewed','2026-07-27 16:48:26.878','2026-07-27 16:48:26.878');
/*!40000 ALTER TABLE `at_risk_cases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `userName` varchar(191) NOT NULL,
  `action` varchar(191) NOT NULL,
  `module` varchar(191) NOT NULL,
  `method` varchar(191) NOT NULL DEFAULT '',
  `path` varchar(191) NOT NULL DEFAULT '',
  `status` int(11) NOT NULL DEFAULT 0,
  `ip` varchar(191) NOT NULL DEFAULT '',
  `dateTime` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `audit_logs_dateTime_idx` (`dateTime`),
  KEY `audit_logs_userId_fkey` (`userId`),
  CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `system_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES ('cms3gp36e00017nagewroyjq5','cms3gnzbk00007ntsu5848z9l','Maria Santos','Logged in','Authentication','POST','/api/auth/login',200,'::1','2026-07-27 16:49:18.422'),('cms3gp3d400037nagss6te9sq',NULL,'Unauthenticated','Logged in (failed)','Authentication','POST','/api/auth/login',401,'::1','2026-07-27 16:49:18.664');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pwd_profiles`
--

DROP TABLE IF EXISTS `pwd_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pwd_profiles` (
  `id` varchar(191) NOT NULL,
  `fullName` varchar(191) NOT NULL,
  `dateOfBirth` date NOT NULL,
  `sex` varchar(191) NOT NULL,
  `address` varchar(191) NOT NULL,
  `contactNumber` varchar(191) NOT NULL DEFAULT '',
  `civilStatus` varchar(191) NOT NULL DEFAULT '',
  `disabilityType` enum('Physical','Visual','Hearing','Intellectual','Psychosocial','Communication','Chronic Illness') NOT NULL,
  `pwdIdNumber` varchar(191) NOT NULL,
  `pwdIdStatus` enum('Active','Expired','Pending') NOT NULL DEFAULT 'Active',
  `dateRegistered` date NOT NULL,
  `assistiveDevice` varchar(191) NOT NULL DEFAULT 'None',
  `householdSize` int(11) NOT NULL DEFAULT 1,
  `livingCondition` varchar(191) NOT NULL DEFAULT '',
  `incomeBracket` varchar(191) NOT NULL DEFAULT '',
  `supportSituation` varchar(191) NOT NULL DEFAULT '',
  `caregiverName` varchar(191) NOT NULL DEFAULT 'None',
  `caregiverRelationship` varchar(191) NOT NULL DEFAULT 'N/A',
  `caregiverContact` varchar(191) NOT NULL DEFAULT 'N/A',
  `caregiverAvailability` varchar(191) NOT NULL DEFAULT 'No caregiver',
  `purok` varchar(191) NOT NULL,
  `riskStatus` enum('Low Risk','Moderate Risk','High Risk') NOT NULL DEFAULT 'Low Risk',
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pwd_profiles_pwdIdNumber_key` (`pwdIdNumber`),
  KEY `pwd_profiles_riskStatus_idx` (`riskStatus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pwd_profiles`
--

LOCK TABLES `pwd_profiles` WRITE;
/*!40000 ALTER TABLE `pwd_profiles` DISABLE KEYS */;
INSERT INTO `pwd_profiles` VALUES ('cms3gnzbs00017ntsp19gt97t','Luisa Magbanua','1982-03-15','Female','Purok 2, Brgy. New Pandan','09171234567','Married','Physical','PWD-2021-001','Active','2021-06-10','Wheelchair',5,'Renting','Below Minimum Wage','Has family support','Roberto Magbanua','Spouse','09177654321','Full-time','Purok 2','High Risk',1,'2026-07-27 16:48:26.777','2026-07-27 16:48:26.831'),('cms3gnzbz00027nts2of2ijja','Carlos Dela Torre','1975-08-22','Male','Purok 4, Brgy. New Pandan','09281234567','Single','Visual','PWD-2020-002','Expired','2020-03-18','White Cane',2,'Own home','Minimum Wage','Lives with elderly parent','Remedios Dela Torre','Mother','09282345678','Part-time','Purok 4','Low Risk',1,'2026-07-27 16:48:26.784','2026-07-27 16:48:26.882'),('cms3gnzc700037ntsy9hrfxpc','Maria Elena Reyes','2005-11-03','Female','Purok 1, Brgy. New Pandan','09331234567','Single','Intellectual','PWD-2022-003','Active','2022-01-25','None',6,'Own home','Below Minimum Wage','Has family support','Teresita Reyes','Mother','09334567890','Full-time','Purok 1','Low Risk',1,'2026-07-27 16:48:26.791','2026-07-27 16:48:26.791'),('cms3gnzcb00047ntswvpb09xv','Fernando Navarro','1968-07-14','Male','Purok 3, Brgy. New Pandan','09451234567','Widowed','Hearing','PWD-2019-004','Active','2019-09-05','Hearing Aid',1,'Renting','No income','Lives alone','None','N/A','N/A','No caregiver','Purok 3','High Risk',1,'2026-07-27 16:48:26.796','2026-07-27 16:48:26.851'),('cms3gnzcg00057nts6onsnk5p','Rosa Villanueva','1990-01-28','Female','Purok 5, Brgy. New Pandan','09561234567','Married','Chronic Illness','PWD-2023-005','Active','2023-04-12','None',4,'Own home','Minimum Wage','Has family support','Mario Villanueva','Spouse','09567890123','Part-time','Purok 5','Low Risk',1,'2026-07-27 16:48:26.800','2026-07-27 16:48:26.800'),('cms3gnzcl00067ntskc20nplu','Antonio Bautista','1955-12-05','Male','Purok 1, Brgy. New Pandan','09671234567','Married','Physical','PWD-2018-006','Active','2018-07-20','Crutches',3,'Own home','Senior Citizen Pension','Has family support','Lourdes Bautista','Spouse','09678901234','Full-time','Purok 1','Low Risk',1,'2026-07-27 16:48:26.805','2026-07-27 16:48:26.805'),('cms3gnzcp00077ntsx96z3nd8','Cynthia Mercado','1998-06-17','Female','Purok 6, Brgy. New Pandan','09781234567','Single','Psychosocial','PWD-2024-007','Pending','2024-02-14','None',4,'Renting','Below Minimum Wage','Limited family support','Gloria Mercado','Mother','09789012345','Part-time','Purok 6','Moderate Risk',1,'2026-07-27 16:48:26.809','2026-07-27 16:48:26.866'),('cms3gnzct00087nts2exwt6fg','Ernesto Castillo','1980-04-09','Male','Purok 2, Brgy. New Pandan','09891234567','Separated','Communication','PWD-2022-008','Active','2022-08-30','Communication Board',2,'Own home','Minimum Wage','Has sibling support','Mila Castillo','Sister','09890123456','Part-time','Purok 2','Low Risk',1,'2026-07-27 16:48:26.813','2026-07-27 16:48:26.813');
/*!40000 ALTER TABLE `pwd_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recent_updates`
--

DROP TABLE IF EXISTS `recent_updates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recent_updates` (
  `id` varchar(191) NOT NULL,
  `type` enum('Referral','Status','Assessment','Risk','Profile') NOT NULL,
  `actor` varchar(191) NOT NULL,
  `action` varchar(191) NOT NULL,
  `subject` varchar(191) NOT NULL,
  `dateTime` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `recent_updates_dateTime_idx` (`dateTime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recent_updates`
--

LOCK TABLES `recent_updates` WRITE;
/*!40000 ALTER TABLE `recent_updates` DISABLE KEYS */;
INSERT INTO `recent_updates` VALUES ('cms3gnzg0000z7ntsoaazamcd','Assessment','Maria Santos','Submitted health assessment','Cynthia Mercado','2026-06-17 08:55:00.000'),('cms3gnzg500107nts11itze8u','Risk','Maria Santos','Confirmed risk level as High Risk','Luisa Magbanua','2026-06-17 08:40:00.000'),('cms3gnzga00117nts5fnuagst','Referral','Maria Santos','Created referral to Barangay Health Center','Cynthia Mercado','2026-06-16 15:20:00.000'),('cms3gnzgd00127nts1xmj91v9','Status','BHC Nurse-in-Charge','Referral status changed to Received','Maria Elena Reyes','2026-06-16 11:05:00.000'),('cms3gnzgh00137ntsbn0idwhi','Status','Maria Santos','Referral status changed to Escalated','Fernando Navarro','2026-06-15 16:30:00.000'),('cms3gnzgm00147ntsn1p26w6i','Assessment','Maria Santos','Submitted health assessment','Rosa Villanueva','2026-06-15 09:30:00.000'),('cms3gnzgq00157ntsh44mmbu8','Profile','Maria Santos','Updated PWD profile','Ernesto Castillo','2026-06-15 08:45:00.000'),('cms3gnzgu00167ntsd8g5pjvc','Status','BHC Physician','Referral status changed to Completed','Carlos Dela Torre','2026-06-14 16:00:00.000'),('cms3gnzgy00177ntsdu8vyp0j','Risk','Maria Santos','Confirmed risk level as Low Risk','Carlos Dela Torre','2026-06-14 13:25:00.000'),('cms3gnzh300187ntsxb3h9blb','Referral','Maria Santos','Created referral to Hospital','Fernando Navarro','2026-06-13 10:15:00.000');
/*!40000 ALTER TABLE `recent_updates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `referrals`
--

DROP TABLE IF EXISTS `referrals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `referrals` (
  `id` varchar(191) NOT NULL,
  `pwdId` varchar(191) NOT NULL,
  `referralType` varchar(191) NOT NULL DEFAULT 'Medical / Health',
  `identifiedNeed` varchar(191) NOT NULL,
  `referralReason` varchar(191) NOT NULL,
  `referredOffice` varchar(191) NOT NULL,
  `receiverName` varchar(191) NOT NULL DEFAULT '',
  `referralDate` date NOT NULL,
  `followUpDate` date DEFAULT NULL,
  `followUpStatus` enum('Scheduled','Completed','Overdue','Missed') NOT NULL DEFAULT 'Scheduled',
  `priorityLevel` enum('Low Risk','Moderate Risk','High Risk') NOT NULL,
  `status` enum('Pending','Received','In Progress','Completed','Escalated','Cancelled') NOT NULL DEFAULT 'Pending',
  `outcome` varchar(191) NOT NULL DEFAULT '',
  `remarks` varchar(191) NOT NULL DEFAULT '',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `referrals_status_idx` (`status`),
  KEY `referrals_followUpDate_idx` (`followUpDate`),
  KEY `referrals_pwdId_fkey` (`pwdId`),
  CONSTRAINT `referrals_pwdId_fkey` FOREIGN KEY (`pwdId`) REFERENCES `pwd_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `referrals`
--

LOCK TABLES `referrals` WRITE;
/*!40000 ALTER TABLE `referrals` DISABLE KEYS */;
INSERT INTO `referrals` VALUES ('cms3gnzez000q7ntscxt0godo','cms3gnzbs00017ntsp19gt97t','Medical / Health','Medical consultation and wheelchair assessment','Missed checkup','Barangay Health Center','BHC Nurse-in-Charge','2026-05-12','2026-05-26','Overdue','High Risk','In Progress','','Has not had a check-up in 8 months; wheelchair condition worsening','2026-07-27 16:48:26.891','2026-07-27 16:48:26.891'),('cms3gnzf7000s7ntssuoflpzq','cms3gnzcb00047ntswvpb09xv','Medical / Health','Urgent medical treatment for hypertension','Urgent medical condition','Hospital','Hospital Social Worker','2026-03-18','2026-04-01','Overdue','High Risk','Escalated','Initial contact made, awaiting schedule','Escalated to Hospital — untreated hypertension, lives alone','2026-07-27 16:48:26.899','2026-07-27 16:48:26.899'),('cms3gnzfh000u7ntsi4svzokx','cms3gnzbz00027nts2of2ijja','Medical / Health','Routine medical consultation','Missed checkup','Barangay Health Center','BHC Physician','2026-04-22','2026-05-06','Completed','Low Risk','Completed','Consultation completed; follow-up prescription issued','','2026-07-27 16:48:26.909','2026-07-27 16:48:26.909'),('cms3gnzfp000w7ntsxupyyfp3','cms3gnzcp00077ntsx96z3nd8','Medical / Health','Therapy follow-up','Therapy-related concern','Barangay Health Center','BHC Nurse-in-Charge','2026-06-01','2026-06-15','Missed','Moderate Risk','Pending','','Coordinate with BHC for psychosocial therapy session','2026-07-27 16:48:26.917','2026-07-27 16:48:26.917'),('cms3gnzfv000y7ntsmt3w7ck1','cms3gnzc700037ntsy9hrfxpc','Medical / Health','Medication review and health monitoring','Medication concern','Barangay Health Center','BHC Nurse-in-Charge','2026-05-28','2026-06-18','Scheduled','Low Risk','Received','','Parent confirmed availability for scheduled visit','2026-07-27 16:48:26.923','2026-07-27 16:48:26.923');
/*!40000 ALTER TABLE `referrals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_users`
--

DROP TABLE IF EXISTS `system_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `system_users` (
  `id` varchar(191) NOT NULL,
  `fullName` varchar(191) NOT NULL,
  `username` varchar(191) NOT NULL,
  `passwordHash` varchar(191) NOT NULL,
  `role` varchar(191) NOT NULL DEFAULT 'Administrator / Assigned PWD Coordinator',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `lastLogin` datetime(3) DEFAULT NULL,
  `contactNumber` varchar(191) NOT NULL DEFAULT '',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `system_users_username_key` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_users`
--

LOCK TABLES `system_users` WRITE;
/*!40000 ALTER TABLE `system_users` DISABLE KEYS */;
INSERT INTO `system_users` VALUES ('cms3gnzbk00007ntsu5848z9l','Maria Santos','admin','$2a$10$wQdM0BP/lt2Osgi90Y8J4e6nT0hRexX7cqfjK6pSfuE9QR7xY84yu','Administrator / Assigned PWD Coordinator','Active','2026-07-27 16:49:18.393','09171111111','2026-07-27 16:48:26.769','2026-07-27 16:49:18.397');
/*!40000 ALTER TABLE `system_users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-28  0:50:06
