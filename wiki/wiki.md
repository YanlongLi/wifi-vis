# Wiki Update

## Data and Design

### Data Detail

There are 17 floors in the building of 360, and in each floor, there are several wifi AP station(hotspot),
now we have the plan of each floor and the position of AP in each floor.
When a device (pc or cell phone) get access to a AP, the AP takes a record.

So, now we have three type of data:

1. Plan figure of each floor, these firues do not share the same size (resolution). **1-17** Floor.

2. The AP Info
	Each AP has four attributes:
	- ID: ids is no continues, between 1 to 389, **250 total**.
	- Name: AP name, floor+ap_number style, "f15ap12, f1ap2" etc.
	- Floor: which floor does this ap locate
	- (x,y): position of AP

	```
	+----+------+---+---+-------+
	| ID | Name | x | y | floor |
	+----+------+---+---+-------+
	```
3. AP access record
	- date_time: access time
	- mac: end devices'MAC address, which is unique to devices.
	- ap id: id of AP the device accesses to.

	```
	+-----------+-----+------+
	| date_time | mac | apid |
	+-----------+-----+------+

### Some Terminology

- AP: (Access Point, wifi热点)
- Device: Mobile devices, which is represented by MAC address in the data.
- Three Main View:
	- Overview: the force layout view, which shows the whole 150 APs as well as device path.
	- Timeline View
	- Floor View: show APs and device paths on a specific floor.
- Login: each record is a login event, which means a device login a AP at some time.
- move: a device login two different APs in two consequece time is a move.

### Design Detail

**Function of View:**

- AP Graph View:
	in AP graph view, we use force layout to visualize all the 250 APs. Each AP as a node.  
	a link between a node pair means a device moved from a AP to another.  
	- nodes(APs) weight: the number of devices logged in this AP at a selected _time point_,
		or number of login occurs on this AP in selected _time period_.  
		**node weight is represented by circle radius or opacity**  
		**node's floor info is represented by color(what color to use will be discussed later)**
  - links weight: how many movements occurs in time period.  
		**link weight is represented by line width**
	
- Timeline View:
	Timeline view is supported to show the total login number in a fixed time interval,
	for example, we compute the login number every 30 minutes, then draw the login timeline.  
	Also, timeline show shows device number change over time for a selected AP.
	
- Floor View:
	Floor View shows Floor plan and the location of APs on it.  
	At a time point, devices on a AP will be shown around the AP location.  
	Links between APs means devices'moving path.
	Director of links should be visualized(ref to [siming.chen's work](http://vis.pku.edu.cn/wiki/visgroup/projects/spatial_temporal_event_vis/weibogeo/version3/start)).

**Collaboration of Views and supported interaction**

- brush a time span in _timeline_ and show the corresponding device path change in the _floor view_ and _AP graph view_.
- a time point can be selected in the brushed out range, then update the device locations in _floor view_.
	Animation would be used to facilitate to show how device location change over time, animation may be limited in the range brushed out.
- when select one AP in _floor view_, highlight the same AP in _AP Graph_(the other direction is the same) and visualize device number change over time in _timeline_.
- select a set of device in _floor view_, then highlight them.

### Work Division

I just finished the computation module at the noon, in which compute the mac location at a chosen time.
so the works are divided as follow:

### Problem tracking

how to represent the link weight, aggregation?

- no aggregation:(ref to siming.chen's design)
- aggregation: computing the weight. this is what we use in floor view and AP graph view.

notes:

cound add time interval information to links if we choose to draw seperate paths, for example using arc radian.

## Progress.
### 2015-02-08

**in the data: same device may log in a AP in very short time**

- network instability 
- (there are APs share the same location, which may have effects on the vis)

### 2015-02-07

![cur version](_img/0207-img-color-change.png)

update:

- changed color scheme and view size.
- adjust force layout's parameters.

summary of what to modify(from 0206's and 0207's discuss):

1. color scheme change
2. problems of views positon when in different window size
3. animate every MAC's position change, ref to [link](http://apps.opendatacity.de/relog/). support MAC selection.
4. timeline of chosen AP
5. collaboration between views

(aboves need quick implementation)

6. data input entrance
7. classification of APs and MACs


**TODO**

1. 考虑单辆车的行为
2. 更新wiki
3. 收集文章（看下祖祖去年的文章）

**Today's Goal**

rewrite basic version and update

### 2015-02-06

**TODO**

1. Force layout 修改参数，固定其位置
	- 如何生成path
2. 颜色主题由黑色改成白色
3. 窗口大小改变时更新画图
4. 实现[网页](http://apps.opendatacity.de/relog/)中的功能
	- 用点表示设备，提供设备的筛选
5. 点选单个AP或者Device时显示其Timeline
6. 显示某个Device或者某几个Device的运动轨迹
7. 几个view之间要可以相互link, highlight
8. 提供数据输入的入口
9. AP分类
	- 登录的人数、登录的时间、停留的时间等
10. Device分类

思考：

- 如何计算某个时间点AP上的人数
- 每个AP上点如何布局

### 2015-02-04

Current version:

![cur version](_img/0204-img-1.png)

(records data is on day of 2013-09-02, Monday)

- 283876 records on 250 APs
- number of access to one AP is between [13,4512].
		2/3 is below 1500.
		when generate path for a device(MAC address),
		only one of neighbouring records on same AP is reserved.
- among 250 APs, there are 2549 links, the weigh of link is between [1,641], which represent how many path on this link. most of these number is below 50.

What update:

- Rewrite and simplify the implementation
-	Add color to Floor Nav bar
- Add AP Graph to show aps relationship

Still many problems:

- Some Aps share the some position
	```
	3,f1ap1,0,0,1
	2,f1ap2,0,0,1
	7,f1ap3,0,0,1
	4,f1ap4,0,0,1
	```
- Path direction haven't been shown up both in Floor Plan and AP Graph
- In th AP Graph, nodes and links are clustered. May nodes and links should be filtered.
- How to generate a reasonable path using wifi records?
- Other infomation?

Todo next:

- Seperate different directon of path


### 2015-02-02

#### Implement Goals

a demo to show the wifi data and to show the data propertiy.

people flow change over time reflected by the mac path in data, 
what't the movement charater? 
What other events canbe shown in this data?

#### What have been done so far

compared to version of Saturday, I changed the layout and color scheme, 
some data process were move to server end;

![overview](_img/wifi-vis-1.png)

records on 2013-09-02 and 2013-09-03 are loaded

- timeline view: show the mac number over time
- floor detail view: show the aps and path in this floor.

#### What to do next

- to show all the aps in one view, using force layout
- seperate path of different direction.
- show the mac number change overtime in selected ap.

