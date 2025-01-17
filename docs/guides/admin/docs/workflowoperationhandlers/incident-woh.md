Incident Creator Workflow Operation
===========================================

ID: `incident`


Description
-----------

The incident-create operation creates an incident on a dummy job used for integration testing.


Parameter Table
---------------

|configuration keys|example                       |description                                  |default value|
|------------------|------------------------------|---------------------------------------------|-------------|
|code              |2                             |The code number of the incident to produce.  |1|
|severity          |WARNING                       |The severity. See Incident.Severity enum.    |INFO|
|details           |"tagged,+exp" / "-exp,+tagged"|Some details: title=content;title=content;...|EMPTY|
|params            |"presentation/tagged"         |Some params: key=value;key=value;...         |EMPTY|


Operation Example
-----------------

```xml
<operation
    id="incident"
    description="Provoke a job incident">
  <configurations>
    <configuration key="code">3</configuration>
    <configuration key="severity">INFO</configuration>
    <configuration key="details">exception=content;id=325</configuration>
    <configuration key="params">track=track-1;profile=full</configuration>
  </configurations>
</operation>
```
