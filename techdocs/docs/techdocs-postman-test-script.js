// Für die "Login" Request - Speichert den Token und gibt eine Erfolgsmeldung aus
pm.test("Erfolgreiche Anmeldung", function () {
    pm.response.to.have.status(200);
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.token).to.be.a('string');
    
    // Token in der Umgebung speichern
    pm.environment.set("authToken", jsonData.token);
    console.log("Token gespeichert:", jsonData.token);
});

// Für die "Create Category" Request - Speichert die Kategorie-ID
pm.test("Kategorie erfolgreich erstellt", function () {
    pm.response.to.have.status(201);
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.data._id).to.be.a('string');
    
    // Kategorie-ID in der Umgebung speichern
    pm.environment.set("categoryId", jsonData.data._id);
    console.log("Kategorie-ID gespeichert:", jsonData.data._id);
    console.log("Kategorie-Name:", jsonData.data.name);
});

// Für die "Create Document" Request - Speichert die Dokument-ID
pm.test("Dokument erfolgreich erstellt", function () {
    pm.response.to.have.status(201);
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.data._id).to.be.a('string');
    
    // Dokument-ID in der Umgebung speichern
    pm.environment.set("documentId", jsonData.data._id);
    console.log("Dokument-ID gespeichert:", jsonData.data._id);
    console.log("Dokument-Titel:", jsonData.data.title);
    console.log("Dokument-Slug:", jsonData.data.slug);
});

// Für die "Get Current User" Request - Überprüft die Benutzerinformationen
pm.test("Benutzerinformationen korrekt", function () {
    pm.response.to.have.status(200);
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.data.name).to.equal("Martin Pfeffer");
    pm.expect(jsonData.data.email).to.equal("martin@example.com");
    pm.expect(jsonData.data.role).to.equal("admin");
});

// Für die "Search Documents" Request - Überprüft, ob Suchergebnisse zurückgegeben werden
pm.test("Suchergebnisse gefunden", function () {
    pm.response.to.have.status(200);
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.count).to.be.greaterThan(0);
    pm.expect(jsonData.data).to.be.an('array');
});
