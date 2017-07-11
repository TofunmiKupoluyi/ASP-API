-- phpMyAdmin SQL Dump
-- version 4.6.5.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 11, 2017 at 11:12 AM
-- Server version: 10.1.21-MariaDB
-- PHP Version: 7.1.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `asp2`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `admin_id` int(11) NOT NULL,
  `admin_username` varchar(1000) NOT NULL,
  `admin_password` varchar(1000) NOT NULL,
  `admin_pool` int(11) NOT NULL,
  `admin_name` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`admin_id`, `admin_username`, `admin_password`, `admin_pool`, `admin_name`) VALUES
(1, 'admin', 'password', 0, 'Tofunmi Kupoluyi');

-- --------------------------------------------------------

--
-- Table structure for table `chat_info`
--

CREATE TABLE `chat_info` (
  `chat_id` int(11) NOT NULL,
  `password` varchar(1000) NOT NULL,
  `admin_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `chat_info`
--

INSERT INTO `chat_info` (`chat_id`, `password`, `admin_id`) VALUES
(1, '', 0),
(2, '', 0),
(3, '', 0),
(4, '', 0);

-- --------------------------------------------------------

--
-- Table structure for table `feedback`
--

CREATE TABLE `feedback` (
  `admin_id` int(11) NOT NULL,
  `chat_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL,
  `comment` varchar(1000) DEFAULT NULL,
  `rating_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `chat_id` int(11) NOT NULL,
  `message_content` mediumtext NOT NULL,
  `user_sent_by` varchar(10) NOT NULL,
  `message_id` int(11) NOT NULL,
  `message_security_key` varchar(10000) NOT NULL,
  `pool` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `sender_name` varchar(1000) NOT NULL,
  `status` int(11) NOT NULL,
  `admins_opened_by` varchar(10000) NOT NULL DEFAULT '[]',
  `timestamp` double NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`chat_id`, `message_content`, `user_sent_by`, `message_id`, `message_security_key`, `pool`, `admin_id`, `sender_name`, `status`, `admins_opened_by`, `timestamp`) VALUES
(1, 'U2FsdGVkX18LPHlRc/1uFYG//bRU35y9/0Yfr3Y0fNE=\n', 'client', 1, '7VN2C3ZTXGihsu4DTJZcwJrjTMNl1m', 0, 0, 'Anon', 0, '[]', 1497961036899),
(1, 'U2FsdGVkX182r4hkgfFWl0p82qtuw36t7438brFwgFTEERL3sYkxdIgZqjTRidBl\n', 'client', 2, 'yIEy4yU1WhgICrrhAbJhP7SFefGoje', 0, 0, 'Anon', 0, '[]', 1497961048753);

-- --------------------------------------------------------

--
-- Table structure for table `rants`
--

CREATE TABLE `rants` (
  `rant_id` int(11) NOT NULL,
  `rant_content` varchar(10000) NOT NULL,
  `chat_id` int(11) NOT NULL,
  `pseudonym` varchar(100) NOT NULL,
  `rant_type` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `rants`
--

INSERT INTO `rants` (`rant_id`, `rant_content`, `chat_id`, `pseudonym`, `rant_type`) VALUES
(1, 'Hey', 1, 'Anon', 0),
(2, 'Hey', 1, 'Anon', 0);

-- --------------------------------------------------------

--
-- Table structure for table `rant_likes`
--

CREATE TABLE `rant_likes` (
  `rant_like_id` int(11) NOT NULL,
  `rant_id` int(11) NOT NULL,
  `chat_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `rant_replies`
--

CREATE TABLE `rant_replies` (
  `rant_id` int(11) NOT NULL,
  `chat_id` int(11) NOT NULL,
  `rant_reply_id` int(11) NOT NULL,
  `rant_reply_content` varchar(10000) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `rant_replies`
--

INSERT INTO `rant_replies` (`rant_id`, `chat_id`, `rant_reply_id`, `rant_reply_content`) VALUES
(1, 1, 2, 'I agree'),
(1, 1, 3, 'I agree too'),
(2, 1, 4, 'I agree too');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`admin_id`);

--
-- Indexes for table `chat_info`
--
ALTER TABLE `chat_info`
  ADD PRIMARY KEY (`chat_id`),
  ADD UNIQUE KEY `chat_id` (`chat_id`);

--
-- Indexes for table `feedback`
--
ALTER TABLE `feedback`
  ADD PRIMARY KEY (`rating_id`),
  ADD KEY `message_id` (`chat_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `chat_id` (`chat_id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Indexes for table `rants`
--
ALTER TABLE `rants`
  ADD PRIMARY KEY (`rant_id`),
  ADD KEY `chat_id` (`chat_id`);

--
-- Indexes for table `rant_likes`
--
ALTER TABLE `rant_likes`
  ADD PRIMARY KEY (`rant_like_id`),
  ADD KEY `rant_id` (`rant_id`),
  ADD KEY `chat_id` (`chat_id`);

--
-- Indexes for table `rant_replies`
--
ALTER TABLE `rant_replies`
  ADD PRIMARY KEY (`rant_reply_id`),
  ADD KEY `rant_id` (`rant_id`),
  ADD KEY `chat_id` (`chat_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `admin_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT for table `chat_info`
--
ALTER TABLE `chat_info`
  MODIFY `chat_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
--
-- AUTO_INCREMENT for table `feedback`
--
ALTER TABLE `feedback`
  MODIFY `rating_id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `message_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT for table `rants`
--
ALTER TABLE `rants`
  MODIFY `rant_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT for table `rant_likes`
--
ALTER TABLE `rant_likes`
  MODIFY `rant_like_id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `rant_replies`
--
ALTER TABLE `rant_replies`
  MODIFY `rant_reply_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
--
-- Constraints for dumped tables
--

--
-- Constraints for table `feedback`
--
ALTER TABLE `feedback`
  ADD CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`chat_id`) REFERENCES `chat_info` (`chat_id`);

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`chat_id`) REFERENCES `chat_info` (`chat_id`);

--
-- Constraints for table `rants`
--
ALTER TABLE `rants`
  ADD CONSTRAINT `rants_ibfk_1` FOREIGN KEY (`chat_id`) REFERENCES `chat_info` (`chat_id`);

--
-- Constraints for table `rant_likes`
--
ALTER TABLE `rant_likes`
  ADD CONSTRAINT `rant_likes_ibfk_1` FOREIGN KEY (`chat_id`) REFERENCES `chat_info` (`chat_id`),
  ADD CONSTRAINT `rant_likes_ibfk_2` FOREIGN KEY (`rant_id`) REFERENCES `rants` (`rant_id`);

--
-- Constraints for table `rant_replies`
--
ALTER TABLE `rant_replies`
  ADD CONSTRAINT `rant_replies_ibfk_2` FOREIGN KEY (`chat_id`) REFERENCES `chat_info` (`chat_id`),
  ADD CONSTRAINT `rant_replies_ibfk_3` FOREIGN KEY (`rant_id`) REFERENCES `rants` (`rant_id`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
