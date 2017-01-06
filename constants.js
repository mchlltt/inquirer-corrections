// TODO: Add potential census tract values & Date values (MM/DD/YYYY)

module.exports = {
    fileIdentifyingQuestions: [
        {
            name: 'radarID',
            type: 'input',
            message: 'What is the RADAR ID on the file you would like to correct?',
            validate: function (response) {
                var pattern = /\d\d\d\d/;
                if (pattern.test(response)) {
                    return true;
                } else {
                    return 'Please enter 4 digits. If the RADAR ID on the file is not 4 digits, enter \'0000\' to proceed.';
                }
            }
        },
        {
            name: 'nonstandardRADARID',
            type: 'input',
            message: 'What is the actual RADAR ID on the file you would like to correct?',
            when: function (answers) {
                return answers.radarID === '0000';
            }
        },
        {
            name: 'visitNumber',
            type: 'input',
            message: 'What visit number is on the file you would like to correct?',
            validate: function (response) {
                var pattern = /[1-9]/;
                if (pattern.test(response)) {
                    return true;
                } else {
                    return 'Please enter a single number between 1 and 9, inclusive.';
                }
            }
        }
    ],

    correctionChoices: [
        'Node update',
        'Edge update',
        'Node deletion',
        'Edge deletion',
        'Node creation',
        'Edge creation',
        'Interviewer ID update',
        'Remove interview from analysis'
    ],

    nodeTypes: [
        'Alter',
        'Ego',
        'HIVService',
        'Venue',
        'App'
    ],

    edgeTypes: [
        'Dyad',
        'Role',
        'Sex',
        'Drug',
        'Drugs',
        'Alcohol',
        'SeriousRel',
        'RecruitedBy',
        'Advice',
        'GroupSex',
        'Venue',
        'App',
        'HIVService',
        'HadTesting',
        'HadPrevention',
        'HadTreatment'
    ],

    nodeVariables: {
        Ego: {
            required: [
                'radar_id', 'seed_status_t0', 'visit_number', 'int_ftime_t0', 'gender_k', 'label'
            ],
            optional: [
                'int_date_t0', 'int_stime_t0', 'd1_t0', 'd2_t0', 'd3_t0', 'd4_t0', 'd5_t0', 'd6_t0',
                'd7_t0', 'd8_t0', 'd9_t0', 'd10_t0', 'res_chicago_location_t0', 'hiv_health', 'multiple_sex_t0'
            ]
        },
        HIVService: {
            required: [
                'name'
            ]
        }

    },

    edgeVariables: {
        Dyad: {
            required: [
                'k_or_p_t0'
            ],
            optional: [
                'fname_t0', 'lname_t0', 'nname_t0', 'label', 'age_p_t0', 'ng_t0',
                'coords', 'elicited_previously', 'comm_t0', 'relstr_t0', 'gender_p_t0', 'gender_p_other_t0',
                'hispanic_p_t0', 'race_p_t0', 'race_p_other_t0', 'orient_p_t0', 'orient_p_other_t0',
                'res_cat_p_t0', 'res_city_p_t0', 'res_chicago_location_p_t0'
            ]
        },
        Role: {
            required: [
                'reltype_main_t0', 'reltype_sub_t0'
            ]
        },
        Drugs: {
            optional: [
                'd1_freq_p_t0', 'd2_freq_p_t0', 'd3_freq_p_t0', 'd4_freq_p_t0', 'd5_freq_p_t0', 'd6_freq_p_t0',
                'd7_freq_p_t0', 'd8_freq_p_t0', 'd9_freq_p_t0', 'd10_freq_p_t0'
            ]
        },
        Drug: {
            required: [
                'k_or_p_t0'
            ]
        },
        Sex: {
            optional: [
                'sex_first_p_t0', 'sex_first_before_range', 'sex_last_p_t0', 'sex_last_before_range',
                'vaginal_sex_status_t0', 'vaginal_sex_freq_t0', 'vaginal_sex_condom_freq_t0',
                'anal_sex_status_t0', 'anal_sex_freq_t0', 'anal_sex_condom_freq_t0',
                'loc_met_cat_t0', 'loc_met_detail_t0', 'hiv_status_p_t0', 'k_or_p_t0'
            ]
        },
        Venue: {
            required: [
                'venue_name_t0', 'venue_freq_t0', 'vg_t0', 'alcohol_freq_t0', 'drug_freq_t0', 'sex_freq_t0'
            ],
            optional: [
                'venue_type_t0', 'location', 'met_sex_t0', 'sexual_minorities'
            ]
        },
        App: {
            required: [
                'app_name_t0', 'app_freq_t0', 'ag_t0'
            ]
        },
        HIVService: {
            required: [
                'visited'
            ],
            optional: [
                'welcoming', 'visit_frequency', 'provider_awareness', 'reason_not_visited'
            ]
        },
        HadTesting: {
            required: [
                'details'
            ]
        },
        HadPrevention: {
            required: [
                'details'
            ]
        },
        HadTreatment: {
            required: [
                'details'
            ]
        }
    },

    variableTypes: {
        string: [
            'nname_t0', 'fname_t0', 'lname_t0', 'label', 'name', 'gender_p_other_t0', 'race_p_other_t0',
            'reason_not_visited', 'loc_met_detail_t0', 'venue_name_t0', 'res_city_p_t0'
        ],
        positiveInt: [
            'id', 'to', 'from', 'age_t0', 'anal_sex_freq_t0', 'anal_sex_condom_freq_t0',
            'vaginal_sex_freq_t0', 'vaginal_sex_condom_freq_t0'
        ],
        negOneToThree: [
            'comm_t0', 'd1_freq_t0', 'd2_freq_t0', 'd3_freq_t0', 'd4_freq_t0', 'd5_freq_t0',
            'd6_freq_t0', 'd7_freq_t0', 'd8_freq_t0', 'd9_freq_t0', 'd10_freq_t0',
            'venue_freq_t0', 'app_freq_t0', 'welcoming', 'visit_frequency'
        ],
        negOneToTwo: [
            'relstr_t0', 'alcohol_freq_t0', 'drug_freq_t0', 'sex_freq_t0'
        ],
        zeroToSix: [
            'reltype_main_t0'
        ],
        zeroToNine: [
            'visit_number'
        ],
        binary: [
            'd1_t0', 'd2_t0', 'd3_t0', 'd4_t0', 'd5_t0', 'd6_t0', 'd7_t0', 'd8_t0', 'd9_t0', 'd10_t0', 'hispanic_p_t0',
            'met_sex_t0', 'sexual_minorities'
        ],
        boolean: [
            'sex_first_before_range', 'visited'
        ],
        date: [
            'sex_last_t0'
        ]
    },

    variableLists: {
        seed_status_t0: [
            'Non-Seed',
            'Seed'
        ],
        gender_k: [
            'Male', 'Female', 'Cisgender Male', 'Cisgender Female', 'Transgender: Male to Female', 'Transgender: Female to Male', 'Not Listed'
        ],
        hiv_health: [
            'Yes',
            'No'
        ],
        multiple_sex_t0: [
            'Yes',
            'No',
            'Skipped'
        ],
        res_chicago_location_t0: [
            'Census Tract',
            'Homeless',
            'Outside Chicago'
        ],
        ng_t0: [
            'closest',
            'drug use',
            'drugs two or more',
            'sex',
            'sex two or more'
        ],
        k_or_p_t0: [
            'known',
            'perceived'
        ],
        elicited_previously: [
            'True',
            'null'
        ],
        gender_p_t0: [
            'Male', 'Female', 'Cisgender Male', 'Cisgender Female', 'Transgender: Male to Female',
            'Transgender: Female to Male', 'Don\'t Know', 'Not Listed'
        ],
        race_p_t0: [
            'Black/African American',
            'American Indian or Alaska Native',
            'Asian',
            'White',
            'Native Hawaiian or Other Pacific Islander',
            'Other'
        ],
        orient_p_t0: [
            'Bisexual',
            'Heterosexual/Straight',
            'Gay/Lesbian',
            'Queer',
            'Not Listed',
            'Don\'t want to answer',
            'Don\'t know'
        ],
        res_cat_p_t0: [
            'Outside of Illinois',
            'Illinois, but not Chicago',
            'Chicago',
            'Don\'t want to answer',
            'Don\'t know'
        ],
        res_chicago_location_p_t0: [
            'Census tract',
            'Jail',
            'Homeless'
        ],
        reltype_sub_t0: [
            'Best Friend', 'Friend', 'Ex-friend', 'Other Type', 'Parent/Guardian', 'Brother/Sister', 'Grandparent',
            'Other Family', 'Boyfriend/Girlfriend', 'Ex-Boyfriend/Ex-Girlfriend', 'Booty Call/Fuck Buddy/Hook Up',
            'One Night Stand', 'Other type of Partner', 'Coworker/Colleague', 'Classmate', 'Roommate', 'Friend of a Friend',
            'Neighbor', 'Other', 'Teacher/Professor', 'Counsellor/Therapist', 'Community Agency Staff', 'Religious Leader',
            'Mentor', 'Coach', 'Someone you use drugs with', 'Someone you buy drugs from', 'Other relationship'
        ],
        sex_first_t0: [
            'null',
            'Date'
        ],
        anal_sex_status_t0: [
            'No Anal Sex',
            'Anal Sex'
        ],
        vaginal_sex_status_t0: [
            'No Vaginal Sex',
            'Vaginal Sex'
        ],
        loc_met_cat_t0: [
            'Bar/Club',
            'Online/Mobile App',
            'School',
            'Work',
            'Somewhere Else'
        ],
        hiv_status_p_t0: [
            'HIV Negative',
            'HIV Positive',
            'Don\t Know'
        ],
        venue_type_t0: [
            'Bar/Club',
            'Bathhouse',
            'Community Organization/Health Center',
            'Restaurant/Coffee Shop',
            'Something Else'
        ],
        vg_t0: [
            'socialize',
            'new_people'
        ],
        location: [
            'Census tract',
            'not_available'
        ],
        provider_awareness: [
            'Yes',
            'No'
        ]
    },

    variableCheckboxes: {
        HadTesting_details: [
            'HIV testing',
            'Syphilis testing',
            'Gonorrhea testing (rectal)',
            'Gonorrhea testing (urethral)',
            'Chlamydia testing (rectal)',
            'Chlamydia testing (urethral)',
            'Human papillomavirus (HPV) testing'
        ],
        HadPrevention_details: [
            'Male Condoms',
            'Female Condoms',
            'Pre-exposure prophylaxis (PrEP)',
            'Post-exposure prophylaxis (PEP)'
        ],
        HadTreatment_details: [
            'CD4+ count/Viral load',
            'Antiretroviral medication',
            'Other medication'
        ]
    }
};
