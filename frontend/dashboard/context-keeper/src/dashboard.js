function Dashboard() {
    
    async function fetchSnapshots() {
        try {
            const response = await fetch(`${baseUrl}/snapshots`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  "Authorization": `Bearer ${token}`
                },
            });
        } catch(error) {    
            console.log("ERROR", error);
        }
    }

    return (
        <>

        </>
    );

}

export default Dashboard;