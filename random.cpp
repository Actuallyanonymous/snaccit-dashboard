
#include <iostream>
using namespace std;

int trailingZeroes(int n){

    int checker = 5;
    int count = 0;

    while(n/checker > 0){
        count += n/checker;
        checker*=5;
    }

    return count;
}

