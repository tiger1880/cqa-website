import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Users(){

    const [ valueEntered, setValueEntered ] = useState("");
    const [ users, setUsers ] = useState([]);
    const [ currentPage, setCurrentPage ] = useState(0);

    // Loading stuff
    const [ loading, setLoading ] = useState(false);

    
    const LIMIT = 100;


    // Add count
    // Don't Allow people to keep going up max page limit set
    // Disable the buttons
    // Lower Case => DONE
    // Loading UI
    // PASS THE LIMIT ASWELL BOTH CAN'T DEPEND LIKE THAT INDEPENDENTLY
    // No results UI
    // Pages UI

    // Assuming Users can have spaces --- like stack overflow
    // Assuming Users can have upper or lower, the search is case insensitive -- like stack overflow
    /// Above two assumptions have not been verified officially

    const getUsers = () => {

        const offset = currentPage*LIMIT; //LIMIT, numbering starts from 0 so

        axios.get('http://localhost:3001',{
            params: {
              str: valueEntered.toLowerCase(),
              which: "user",
              offset: offset,
              limit: LIMIT

            }
          })
        .then(function (response) {

            // handle success
            setUsers(response.data);

          })
          .catch(function (error) {
            // handle error
            console.log(error);
          })
          .finally(function () {

            setLoading(false);
        });

    }




    useEffect( () => {

        // console.log('useEffect ran');

        setLoading(true);
        setCurrentPage(0);
        getUsers();

        // return ummount callback function

    }, [ valueEntered ]);

    useEffect( () => {

        setLoading(true);
        getUsers();

    }, [ currentPage ] );


    const nextPage = () => {

        if ( users.length !== 0 )
            setCurrentPage(currentPage + 1);
    };

    const prevPage = () => {

        if (currentPage !== 0)
            setCurrentPage(currentPage-1);

    };


    const handleChange = (e) => {

        const v = e.target.value; 

        setValueEntered(v);

    };

    return (

        <div className='m-4 p-4' style={{width: "100%"}}>
            <h1 className='h2 mb-4'>Users</h1>
            <input placeholder='Enter display name' className='p-2 mb-3 fs-5 form-control w-25' type="text" value={valueEntered} onChange = { handleChange }></input>
            
            <div className='container m-0 p-0 d-flex flex-wrap gap-3'> {
                
                loading ? "Loading" : (users.length !== 0 ? users.map( (user) => (<div className='card shadow border-0 my-3 rounded-0 w-25' key={user.id}>
                    
                    <div className="card-body pt-3 pb-0">

                        <div className='d-flex justify-content-between'>
                        { user.profile_image_url ? <img alt="profile" src={user.profile_image_url} className='w-25 rounded-circle'/> : <img alt="profile" className='w-25 rounded-circle' src='https://graph.facebook.com/694282006/picture?type=large'/>} 
                        <div className='fs-5 fw-bold border-0 p-1.3 mb-3'> {user.display_name } </div>
                        </div>
                        <div className='m-0 p-0 d-flex align-items-end'>
                            <p className='my-0 text-muted fw-light' style={{marginLeft: "auto"}}>id:{user.id}</p>
                        </div>
                    
                    </div>
                    
                    </div>)) : "No Users")
                
                }
                
            </div>

            <nav aria-label="Page navigation">
                <ul className="pagination">
                    <li className="page-item"><a className="page-link" onClick={ prevPage } href="#">Previous</a></li>
                    <li className="page-item"><a className="page-link" onClick={ nextPage } href="#">Next</a></li>
                </ul>
            </nav>


                
        </div>
    );

}

export default Users;