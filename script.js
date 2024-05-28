

const firebaseConfig = {
    apiKey: "AIzaSyCiH_x5I0_AzfxNlSG9a0wLuJBKV4ZgCD8",
    authDomain: "http://student-3c353.firebaseapp.com",
    projectId: "student-3c353",
    storageBucket: "http://student-3c353.appspot.com",
    messagingSenderId: "870916877082",
    appId: "1:870916877082:web:461c652cae572a50821aa3"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

function registerUser() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            console.log('User registered:', userCredential.user);
            alert('Registration successful!');
            
            db.collection('users').doc(userCredential.user.uid).set({
                email: email,
                role: 'pending'
            });
        })
        .catch(error => {
            console.error('Error registering user:', error);
            alert(error.message);
        });
}


function loginUser() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            console.log('User logged in:', userCredential.user);
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            document.getElementById('user-email').textContent = userCredential.user.email;
            
            checkUserRole(userCredential.user.uid);
        })
        .catch(error => {
            console.error('Error logging in:', error);
            alert(error.message);
        });
}


function logoutUser() {
    auth.signOut().then(() => {
        console.log('User logged out');
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
    }).catch(error => {
        console.error('Error logging out:', error);
    });
}


function checkUserRole(uid) {
    db.collection('users').doc(uid).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                if (userData.role === 'admin') {
                    document.getElementById('admin-section').style.display = 'block';
                } else if (userData.role === 'teacher') {
                    document.getElementById('teacher-section').style.display = 'block';
                } else if (userData.role === 'student') {
                    document.getElementById('student-section').style.display = 'block';
                }
            }
        })
        .catch(error => {
            console.error('Error checking user role:', error);
        });
}


function showAddTeacherForm() {
    document.getElementById('add-teacher-form').style.display = 'block';
}


function addTeacher() {
    const name = document.getElementById('teacher-name').value;
    const department = document.getElementById('teacher-department').value;
    const subject = document.getElementById('teacher-subject').value;
    db.collection('teachers').add({
        name: name,
        department: department,
        subject: subject
    })
    .then(docRef => {
        console.log('Teacher added with ID:', docRef.id);
        alert('Teacher added successfully!');
        document.getElementById('add-teacher-form').style.display = 'none';
    })
    .catch(error => {
        console.error('Error adding teacher:', error);
        alert(error.message);
    });
}


function showStudentApprovals() {
    document.getElementById('student-approval-list').style.display = 'block';
    db.collection('users').where('role', '==', 'pending').get()
        .then(querySnapshot => {
            const studentApprovalList = document.getElementById('student-approval-list');
            studentApprovalList.innerHTML = '';
            querySnapshot.forEach(doc => {
                const user = doc.data();
                const div = document.createElement('div');
                div.innerHTML = `<p>${user.email}</p><button onclick="approveStudent('${doc.id}')">Approve</button>`;
                studentApprovalList.appendChild(div);
            });
        })
        .catch(error => {
            console.error('Error fetching student approvals:', error);
        });
}


function approveStudent(uid) {
    db.collection('users').doc(uid).update({ role: 'student' })
        .then(() => {
            console.log('Student approved');
            alert('Student approved successfully!');
            showStudentApprovals();
        })
        .catch(error => {
            console.error('Error approving student:', error);
            alert(error.message);
        });
}


function showScheduleAppointmentForm() {
    document.getElementById('schedule-appointment-form').style.display = 'block';
}


function scheduleAppointment() {
    const appointmentTime = document.getElementById('appointment-time').value;
    const user = auth.currentUser;
    db.collection('appointments').add({
        teacherId: user.uid,
        appointmentTime: appointmentTime,
        status: 'available'
    })
    .then(docRef => {
        console.log('Appointment scheduled with ID:', docRef.id);
        alert('Appointment scheduled successfully!');
        document.getElementById('schedule-appointment-form').style.display = 'none';
    })
    .catch(error => {
        console.error('Error scheduling appointment:', error);
        alert(error.message);
    });
}


function showAppointments() {
    document.getElementById('appointment-list').style.display = 'block';
    const user = auth.currentUser;
    db.collection('appointments').where('teacherId', '==', user.uid).get()
        .then(querySnapshot => {
            const appointmentList = document.getElementById('appointment-list');
            appointmentList.innerHTML = '';
            querySnapshot.forEach(doc => {
                const appointment = doc.data();
                const div = document.createElement('div');
                div.innerHTML = `<p>${appointment.appointmentTime} - ${appointment.status}</p>`;
                appointmentList.appendChild(div);
            });
        })
        .catch(error => {
            console.error('Error fetching appointments:', error);
        });
}

function showBookAppointmentForm() {
    document.getElementById('book-appointment-form').style.display = 'block';
}


function searchTeacher() {
    const searchValue = document.getElementById('search-teacher').value.toLowerCase();
    db.collection('teachers').get()
        .then(querySnapshot => {
            const teacherList = document.getElementById('teacher-list');
            teacherList.innerHTML = '';
            querySnapshot.forEach(doc => {
                const teacher = doc.data();
                if (teacher.name.toLowerCase().includes(searchValue) || teacher.department.toLowerCase().includes(searchValue) || teacher.subject.toLowerCase().includes(searchValue)) {
                    const div = document.createElement('div');
                    div.innerHTML = `<p>${teacher.name} - ${teacher.department} - ${teacher.subject}</p><button onclick="bookAppointment('${doc.id}')">Book</button>`;
                    teacherList.appendChild(div);
                }
            });
        })
        .catch(error => {
            console.error('Error searching teachers:', error);
        });

function bookAppointment(teacherId) {
    const user = auth.currentUser;
    db.collection('appointments').where('teacherId', '==', teacherId).where('status', '==', 'available').get()
        .then(querySnapshot => {
            if (!querySnapshot.empty) {
                const appointmentDoc = querySnapshot.docs[0];
                const appointment = appointmentDoc.data();
                db.collection('appointments').doc(appointmentDoc.id).update({
                    status: 'booked',
                    studentId: user.uid
                })
                .then(() => {
                    console.log('Appointment booked');
                    alert('Appointment booked successfully!');
                })
                .catch(error => {
                    console.error('Error booking appointment:', error);
                    alert(error.message);
                });
            } else {
                alert('No available appointments with this teacher.');
            }
        })
        .catch(error => {
            console.error('Error fetching appointments:', error);
        });
}


function showMessages() {
    document.getElementById('message-list').style.display = 'block';
    const user = auth.currentUser;
    db.collection('messages').where('recipientId', '==', user.uid).get()
        .then(querySnapshot => {
            const messageList = document.getElementById('message-list');
            messageList.innerHTML = '';
            querySnapshot.forEach(doc => {
                const message = doc.data();
                const div = document.createElement('div');
                div.innerHTML = `<p>${message.senderEmail}: ${message.message}</p>`;
                messageList.appendChild(div);
            });
        })
        .catch(error => {
            console.error('Error fetching messages:', error);
        });
}
