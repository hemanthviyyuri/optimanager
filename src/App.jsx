import React, { useState, useEffect, useCallback, useRef } from "react";
// Logo embedded directly as a data URL — no separate file/path needed,
// so the build can never fail due to a missing asset import.
const BRAND_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAABbiklEQVR42u29d9wlVZE+/tQ53TffN0/OwzAwQ84gypBUDGtAUVcUE6KCGBbEsCqy6woGJBpAXUCRVVAJKjAoyJCDZBgYJjE5vvHm7j6nfn90On3vC7r7/bk7M3TN55033Hv79u0+darqqaqngFRSSSWVVFJJJZVUUkkllVRSSSWVVFJJJZVUUkkllVRSSSWVVFJJJZVUUkkllVRSSSWVVFJJJZVUUkkllVRSSSWVVFJJJZVUUkkllVRSSSWVVFJJJZVUUkkllVRSSSWVVFJJJZVUUkllFxRKL8H/znXmzovO/9Nj/A9fn0qqIDuIMjBA9MqLmAi46+uwtgFiAmaJbJeiTEkRADi9klvPSd6GNXoCoI/9N3j8CurAwX1MFSdVkB1SjAWaWJzXXw859mh/gaxWTqlMtqG9bI+U7jYXvHIDULC19cIK6QzVbbcEIJevUrFYxFiFqdmos8ozHb3Qzm2uaHugT3g9GdKlMlNeSpdKbnOyXWi+obqlQedB/z3nk0qqIP+rStG+AG+9BNl1Wwp9QheLYy1gaJujlj7vNm98LF8FBhsA6OevR+bI42BNmZfryWesPHqtLGx0wdU5MCQYDIaGlA2AK6h5raFhr7Z1bXNkwRfRDN9rXl9f/uADG6Xdptp5K2fbxazrdvfp0YOmVkcP/gTcv3WuqaQK8o+8XtFiu+nb/WXPUX2DdZl/YYXr/WmJqjy7tTZ8xVthnfbZ3AC6rTmQ2AOeWACBPTTRDCj0CYFuBhXJBpCh5J1gAAqAx/53cAXMI5C0Hpq3QNMyWHopHLm6vqG1+vOfbgxduQnisL0nFt/6mmapaMlcfxmVSs4a+vR526qvdP6ppAry/7u1uOnb/eVtw+6kwVHLXr6sNfSzu2rD1x8OedL5pVko0hEAHQVJB2mi3UReFGAHIbYC4CH+zgDAvs0I34pBICD4TiACJPwvK/gugrNpAmjqMXh4EcQPAbgHY62Hj359c+sSTBEfPL45sO8CKg30qbqqW4OnfnewklqVVEH+IYpxxWmwvVLvZEdRac1aMXLxjduH/nIS7KPP6DkAZX4zWLwBxPujTAIgwGHAAaBZA9DwI3fSzAQQiThIIIIRghOi8J7Dp1CkQhyFGBQ8W5BEhoAMAM1AVTcA8Vcw34YaL/7GotFnzwPw+Q90zZw3WRSaSgzOWD+0+T03BLYpVZRUQf6fFOPcKQVvpDVr05jO/Px3vHbt6OgY/764AP3WeyHpJORoDxQChWgwoKFAYM0QgqJlTLF94HB1M8B/+/qHT6FAXdAGGPs2RyPUJwGJHPluW4UBlx8B8a8xhBvpjaNr9p9X6j/xKDk9b6uWGKquPusGNFJFSRXkv60YF5zW2y0sPWds1Gp885eDq/lcZHBC11shxcdBdAx6iNBkoMkaDA2GCJ0if6kmshahPSAGg0KLECpOsPDZxGsjfaC2Y3H0kH+mwdshBJeZAQoUhiTyIGQEdEU3hdKLofQVdx9R+dMxQP6LHyzMy2VIlVq1lV+4FrVUUVIFeaXrwADw3Q9MKua7nNkbRl0+/5fV5fzLUjfmyQ9B0Oko0VxoAuoaYHgABAARrVtiAlNsGajj8BwpULwIqe3nztcYfw88NQYzgcDM/nomI/zm2ANj370DQ8BCSQAaQI2fAutL8MfR/6LzgK9+tLCgu5R1q73DK847L0LKKA3mUwWJFsIVp8Ee1r3zq1pnvvmfo8/wT9CFBV2f1jl5hiiLiahrwGEVvEZE+39yOze299ApSqyzUEv8uIOizdp3lBIGIWFJotxjaGXC+MQ/SmhimExjmDiQf2YaAkBeSNiAHtXLhdAX4ZdjV9NFE+SXPtxa0JvlkS9eUVmeWpNUQaKVe+7JfdPtnDf16hutF5b/05CDT/Z8Qkt8SZTFZNQBuNoDBdYC5tKNPKfY34kVIRFtRH4ScfhDZEra1Yza/hgpg5EADNWrwxpRW4AfRPTGcTk4FCNHEjmCHtMrhKv+Ha+p/OJN+5cGjjlSzFLg1V/5QWXw1W5NXpUKEu6M556EzMSppd2WbbRrl94wvJZv63mb7sUFokssQJ0Bl03FMFau6e53ALSIMCfR4U4hUhxOhBex69WeDwn/D45tvmV0Jtx5J3mc00VkooJTZWgNsMj5SJgeVY+Imjqbjq/e+4UPl3cvF3RGTagtO+88eK9Wa/KqtSAXf6w4qZWzpn3xB6NP8635ybqUvUR0iRPBABra04A0UKjEih13EbbF1AnD0rboA8uSXLftm/44673jCZw8K+rQHCTxgo73Ck5WB0F9iSRcBhp8OV7E1wbOHlWfObFrz4JUa77w49rW1IK8ClwqZtD3PtW71yjL1jev2L6C7+w+VZfEBaJEfRhlBWaCSLhSnWCUudCo4xryK15XGt+kJd7DeGIcfJhQ77j6+vLO0MuckREuhX9SIBC6hNAVXiMaOIMWDf/x+5/r3YvY8z5/SWXZq83lelUoSLiZXnjS9Hzv9Nq8P7+o1//yRGXp3eRPRL98O+oM7bISguQ4aFOw4/O4K5E7wSo2Agxqc5ba1MkIPXxU6u+8NW2AsJlmDFOP4Qf/exSIqP2jeMgKCxagR9QPxLWjnz91uKu89wSaqbeVl511w/rGq8Xl2uUVJAhm+YrTSgMqK2ecftnoE3x7+TW6LH8luuQMjGoPzDIAazuviOn0t0Op4+3q4+3Yoc8FGv/5EUpsvg+1PdheRxU6au1RRhIEaz+flzvljiXB0CAweoRUQ/pxuck7md5dffG7p5cPcRq86l+vqm4Lr22qIDu5clx+es8sz3LLn7u09qx3a9fpckBeCgGJBnsgWC8XYySWF/1dDlTbWg7XqpExD/0lHi+bHocGbadjrGtqM0hsvHGwqTMFCtyRXmHDonZ+yOh9ybQ0HkrC0i09Jgb5Q3TC6E2Xn13YX7V4+2cva6zf1ZVkl1WQ0AW44syu3UYcFl+8orJc3dF9qZgkz0SVGZo1CDLOxSVD38iHoXjVt8OuBiaVjJiJTA0wXbBEYM5BqB4F3ooBSe1oGDGh4839w7NpoqgdXw6MH7+MkxXD0EnNbs/yMzQ0siQhATWsvmIdN3b+RZ8tLdCucM/64diKXVlJaFdWjos/Wtx7m7Bq35w2uk69tvd6OVm8EyPaBbMM4Ftzm2amGLwljpPWgL9o/QVngKQULkPDPeMOd4zbs4XjbeskANQYsMGwKcZj8bIJu/EepwSSGyiOf95kWrNAUam9agXR524/U00aEowuIb1B/oF91PCnv/+57rnVqpf/+k9rz+2qSrLLKUh4oy45s29hAxj7Yt/QmFrUc5vsF6/BiHbhF41TtCyoc281LQSDKbzz1O7zRGswoQQ0/n4dPatToTg4q+0KKAogS3E6j4wse2LxvzJO1QHBmXYxtkIceFQUaxmDAp0iihKS/v+aGUQeeoWtNunf2MeNnPStT2XnarYK//rj2rO7opKIXVM5SguHNI188VCMqUW9d8te+RoMazfYn+PgG2BmY28OXHszbxAbiUBzwjIrbusAD4/DxAk0mI2AIYCZQ6UIDxst2DqDNZvYQKcy8Mtsapz48ivCot/DSJ6C8/d9PTacymi/CD598HuMb+noIDYGtSsnind7d/f+/ks/aq3Wwq6ce0px31ChUgXZAeXccyGIwN8/vXevMWXVvnH4YNWbiiWyRxyAUeVBkG0GGcFiiVZK9BU+SUcLmaMAJPGUWAv8Rc/BOmNqW7CmnQj3cl+VdNQI4n+rM8gz43ROFpOwqdqxMgTuVIdnEGC+iXAqVloCsZHP5ISikXlsU6kDm2NjRLuiX7xV/aXv5q//cGRNsVvWLvhYacGupiS0K1mOH36qe64nwWfuPrpR7dP7gOwRB2JUuyC2k3VRiO40OpKBcUwe+/YMdBQntgeznY0acYSfeFp7Ubsf/WQJ/JgDmimBfgm43BnTjFOjYsTm4GTy3oDEEiW+gOE5Ja8Btftn42B2xjtouOgVthpUN1vHjL7jwtO75glF3uevGH1pV8mT7PQWJPSVf/KZiZMcWxQ+c/noarVXz02yRxyIEe2CYAcuB0fGgjl0P8jYmaMHSZPpClHUwRE+1+8AASO50/pfTNEzFQMtjrdoNmwAc7w7B0eghga7nPhwUa1vGFuHCRMNcJMTqXDi4JkcWrWgyYSjgwW/E5H//r4VDR3L4Bzj9wyQYsMlZNPiEmwMa1cOWG93/9T7y7N+OLbCI6/03U8WJ1JH2ViqIP8nFpAAvuTMvq6GdiZ/7tLhZ9Vt/VfLAXkCRpQLgs2GE0M6zjoTt2NY0aIIHvejE7/utf3JCV+N48UYLk/4fReSgBEGa2O5s9FUFWhT4OMTmgA5CZeKyVBMDnsHJZiHtO+OwXjcPy8K1SkR68RvxwiVI3xUhwoeoWexYxdfFybjfNhUkkHlWhPF+93F3f/xhR/XniXiGRec1ttNfzNrlCrIP1xOOwi2V/f2/MzlI095N/d8RUzChzAUBORhRBsuLoD8hR/V0LYX8oVYKCUyCLGFSIbeyTYPMiwShcgUexrYqgDbOJ5ORCb+XxUYTfZdK4QmDmCXKa5+CV7nMtFWBZQIUByZRIpfFitM+BnjhwixIvkvS4B2nMCfKQnqxSmdUEl85bIwol1rgvwK39J96tk/qj9Wlmr+9SdBphbk/9C1AsDz9+ve+9I/9z7NN3a9UU4Q/4Ex7WlmK9z9g1VBZtESM1OiEjZak+zvsoi8mQShAptBbLyKiOJ91Q8KwkjeZVC/BNYqQMXHDQPyBDDgMaEFsBssXh2c9xDH7p4CIQNgtfKtkx0VhFBoAcgABog54S61BfY+SsXg4PxNGIEj9Is7Xk8BYmdGRwTNEjV4qk9cybeUXvv71ROf3tTfvS92cldL7KzKQQBfclrXbkOes/WlH2zr0T3yOihoeBCExGJA5BQYiyJhQUL4NoRudQDzRNBtELGb/neD/ShXh9mJICcXOmYMZg/+Lq8BXq8AO7AUkggjDLQ0ghJFZgWgBVDLqD5xGDymiWTgshGAFhNWKmCa9FlTKHaBEoicYoIAoaHB2netiBMoFccLP1BqZj/XkYzPKL4+puIwSEexnN/U62qSIOiy/ZvbTttScqm1/dJPd8/ZmeORnVFB/Gank/u6WkoVv/XzxgYlsv8lCtSHBmsQi9B1IEQ+M3GoGEzcFnNEzgdFWbPwdRwGu4EiGQ6Hy8CQ8tlDVBvea5wnNEATBPCcF/v3xOAWE2/VRJYPKZPDQJOBRrAAJYFH2bc0FhgeM7IAXvB8G9dNgAuCNvIsYaZCM5ABeFADowyyyIettblpUPsmEn4+Cq0pR88ZH9TgGBgIjyHRYCWKYpIqyl+e/aPmuloTfV/4aH95Z41HxE5oPQAAXXl34Tk/qz3NN/aeIyfIo/Wo9iDYMgPtEGliAKQpdqmTNzqONziGTjlyP8bpkvIA6pbAMPvZ72zg/oQLVcc0DnAATBagQQ2s9MA2ETwAFoFfVHGXigugRb6CaD9+wRZtIrCEBgNPacIMGSBpwb6sDeBZgWADGNGMVQqYJAC3w7VKWhvTegapHGIykplEbYoA1kEno2Yy0T0mtjCmXTnBeiP/rvwvX/7p6GMTLWeh6V2mCvIPdq0uO7U8f7vilfyb/j11F30TY0oJkIhcKAOlMhc5JRYIYASq4UIIER2/JsnfQSnAfZDYgV0Gz5SEpz2ffyrcpQHAA2PU3/nZAVAQ4D4CP6ZAmhkKjC4C1gMYDayFC7ADcN2HcAEG1mpf+TwQsgQsVUCVQVMlowWwDfCopoCJ11cYCd8SPeQS7WH5wZJmboNtO6wHJ5OlcXDBQSATQ9Mc7TqagisVL37f0rLEiFK627qAf1PevVrXqy89tXtOENBRqiD/wKzmdz8wqaghyudfVd2mc/xTkRE2XIDBwtjdTF+b2lyIOEegA5cqjkUo6XMH8YA2Y5XgZFRQVDjXAv+pFSf2XGbkiLBJAUOBC+UBmGMBGxR4pSJIImQAbjB4uQZsAtUBOAA3Ags2BvBaDeQCqp4Kgx9TwFQBlMi3UhUGb9RADgwXBEEExYzbW8BsC+gWvtKBKLCK6ICNTXBa+/GX/z1EqPx6TWYi6A63jHwLwiGqRawB1iTgMESWbJWV15x3bW2rLd2uK06bUqDUgvxjUStZqOzx2Z+OPsm/6f6w6BVHoqo8BiRpcEDyCTJ3e510Lzi44ZEimAuibVclX4l8S6IT7oWvsHUAMyXQJ8F/bIVeFcFlYJIkfjAgWXcATJSgLAGPKqDJIElAnqCfUf4xGwx2A3SLAGzQ4IpvXSABfkYBgxqYIwFFfsD/iAL1isByBav0VodQEMB8yy9dCZPvzBQrQXSdOFj0RkKQ4lCqo8SkjccxsigBi5EPUYRlzxIV9mS/PIJ/2/WJT11Rf8q1RufvbKjWzqIgRAB/64Pl/q2jsso/n5RTOfkdNLQGQ1CETlEyR2EEpNzhVpiojBGz6Og7QYfVTNyuOP6iDAoM6TAbqDD07S7IBtACY0CA8wS+1wFsgLLEPE2A12vwUgVkBLhM8NZqeNuZVANwHYbbIChF0Kv9LlzkCRgC+CkFlAk8UfgKs9QDRhg0RfhxSwaEPzvAEANHZIBmgFhrg0srCs6Dzx5tIpywkBRm7k3XS48bpFMY7EdFnzpi4ALAAnVWqmB9m68vTdg0pkYv+Uhpws4UsIudxHoAAKQUsy74deVF5Btfl91iApoB5WcMP3ICwoxuVuACaJCfTadOVEbHMQuScKjva+s4QI8oHTQYyk8/4qgM8KKGXuICBRBqDNovA35aMa9SQJYIUyRYE7wnFbwqQGWJrKNhPa9gtRhZCWSZIUc0y7UKsAgqS1CPe+AhBqZKUI8AtmvgLg9YIP3zyQG42wW/oIEjbSBHgOvDsFFa0AmVgDm2DuPmPJAoTtTxdWTDekL7wEdYnhLEJGjbiASazLJM3Vpa5//Hta3VDmhu6mL9A6zHxR8rTlo/Krfy9X3TdEF+BhWtNbMMFCGuldJxEozNqtTQpWAGNHO7VTB21LD7ITxeMi5pMvNLyn+RBYIKciLTJGgfCX7Yg3rI861GiYB5Fuk/uuARBk+z4OYI9qCGtUqDe2w842Vw422Ea26VfNnqHH7+goXF1wErN0pQvw2rypAveKwkQU+TfsblDhcQBJomAAHwAy74cQXsZfkuWC0YtWAT0GJgi5ds4w3dLGJAJFCoyIKOF8RTu/tqlPeb4EbifZglRrVGQXyIb+rfY/lGtfbCU/LTsJNYEWtnsB5+fkzOuOzGob9e/N6+H4qCzGFUeUJC+gECJTrrmMMGuujllCxtjXu34+jG/JkZTSbkCbCI4RiE1EVB5DDrv7pEMyVohgTqAOoAHZIB1mrwPR60RRAHW6AFEvopD63fu5x7d4ZyCwWeeNDCr67J8B1biljR7EM1N0DI9xEyWWCwylg7Qt3edsxdNoI3P9/A+3pBe3c5jDmS3Ps9EisU6DAL1CvA97rAIwqYLn1XrxbQaJcIWOuBt2lgvu3PFHGDq2GTf+dHlQ85F0S0VSYKmuMbQMlWYnMMo8HXxW0mP9zfFGtRFJauqwuuXFx/57nvyx8MYMPOAgzt6OfH3zutNLB22C5c8pam0n355YIoq5UmQUBbZ2CySLutlxxtZLVmL3ebQjKaGnq7IioI0GQZuSnsAZQF0GLo+xyQBdCRGcAWgAfojR70H1oMJhKLbIgDbLR+3UJ2vcur9ynjmw/YdN0zE9Cc9zrG7kcQ+qbCKnUzSl2Aq4gyknlsBN7IdmDrasLSB1HY8gTeO20Q/3qix7utqFCrJpB5XwbYosFLPFCGgbdmQP1+fALFwF9dsALosEyAupHfqSjBGFLE6z1QSQCTLcOPoHb2k0QnfNSWmxwXGj2no/U3Kt9i1iSYJASN6P0+cI2z7bWzWXzqisYG7OAcW3JnUODj9rH2/I/rKi984+TSV6lHHo2GViDIaE9DBNaMp/FRaUmQXQ9sBBFxe1EixbFKlggl4bsnS13fh+8WoDwFJR7ENN8irNLQf3GBIkC9BJooAQek12nolxhcJmR6Gdc8XsK7bunCA7k3Qp1wOuyD3wIxaz64pUhbNnhCP7SrqTSjl+xclhwnSzR1d7b3PZKcGfviifUerrttC80sAfsvdKEUgR/0/A+1jwVaaPlGcY0CbndAPQL0mizgkZ+jsQBsVsATLcI2BZppAZNtA9kLmE3N+CNhcYNsZYRaJTcxwx2Oux7jbk0ixYoKQugWyu++oPLzNxxQnH/7461NO/omvcNXW/70o/3lQUcX7z6n1FJ5cY3wkPdB+bhDjqJ9zdARNlhvw5ZrTpa7R7y2QTkSUZiyBqCCI06UoC7yleTxQFF6BJAnggvQPAloQP/ZAW/SoJKA2M8Cb2bo7RqZisZXH+vGWU9NR+P4T8I+9oPQIk/aEsCUAeKWB2QLZO0+hbTOYMqcImwQxoY19jtyAuV7sxgaLgJzDkW9eyJ++8g6LmuXXtuosVMjkjMkxBsy4O0auMcFHvGAAyzQ4Zk44bhGgx9oAas90Ewb2C8DFCTg+NOuKBnvgRDhgaZJIQoKosdxPsLr798WptB0B73tQfemC2iL9jjvRFx9zX2u+76D8/KOZ536jqwkO6yCMEDnAXjnkYW5P3lwdOUZx+Y+KHrFe1Dl0HoY2XUygsmQiCSAIMOeKia0dcwRtWWNwxIMYy6BXyqSFaDdLSBL4Cc88DMeuM5+EJ4h0BwJ9Ajw4x74RQ/sADjUQqbO+MLD3fj2st1gv+Ms8JR9SNkCNGkisSspM6MH6CmBHYHCrCJkVwYzp9mojDGqhRLe9PouLFur4TQ17/OaXoxiOum+2bT4vmXIoYWj92hCH5slesEF3+ECwwzxpgxofxsYYWCFAj/gAi94PgL2upzvUjmByyUomfyMrlFArBUPgAv4TgzHNc61G4ba8LWCoIXMZjIFJbpEBjUx9tbzazcfs7+1+51Pu1vCe52iWP8934pPOgly2ZZG8fmlcDTR6WgFqW0VQI86qlBNlkCEOY2ge84vtWBm3UmYwHFfQ/AVJQVjN8IFUCXQHBviHXnQHAl+UkHd1IL+iwNeqSD2siFPzAKS4NzrwXrA4x81evh7K2Zx5u2fYa9rBvkVjhlkpvWyPXeAPZd5xr4l0OQuZC3CvNkSmTwwlslhwT55WBLQ3Tm8/t3T0TupRM3tY8wT58F+25n85ecn45fbumDd22T3dgX0CNDJWWCqBD/ogm9tge9t+VvgG7OgI3KAEIy6AXMrMHRQjKODkhRt5Dx0MrHIMaoXQt/MmiMYnOJ7Ehw3Ok6gJiTQABToI3wFrC0N8i45IeRwSS3Ifzv2+PAhhUkPLEN1+YVde1KBvoYWM5hE5At1ICZGp3nQuAeDS4Gow79OOgvxEJuA3YMouN0UZMQZkojmWKApwq+WfUmBX9LgDQo0SwJ72bCGFZ5/KU/v/X0Pqbd/DnrvY8HsgrJFUKFIVj6LfY/sxvaqoFmTBYo9AttrjL2n+IPSt7kCh8wRaDiMaZMt5CTR4t8PgstFyLINnZsEyufx5zufxru7FPoPUODXZAirNPhuF1gVJCsOtCEOz4KKMqgSBgWTcuOsuhE6RKS+7LccU/K6UoL4l2OH1ODYMq5jmJAkI/pnAQ9KFEQvVP6+z/3Yfm63hZmJS55rjeyobtYOaUGicieVmbT4sfomgP8ZGfIHZCaafqLsLUGHPRt+wirczTi2BBTWFsW7I4HCJKBRkhLdapeZNRPsAAHKBtalBtBECXlCDuJg2z/n1Qrebx3wkx7wuhw+/1KBq3u9kbHvG4ApZcodthA0cypxVxc3WzYqwxrHHmjxSFVjt2kS3dMsdE2y0DXRwuyZAsyahSDOCuDWh1wU5vai/+DJ5FllaK8Je//X0+iM1+DrG3MQWUDd4vqQb42B2QLi9VmIfTLB2iSgSGAJoKqJtyugpsNkIRmfP7bE/t+INRH718koyUlm4onb8isgdFYLB5UJGgxJDImPLhscrMiM25vCvP8Duf4kyMfQu/CC3uEX9KKBpaKAeWhp7ZNMm1h83MzBMYrSQdQZROLG72SSXnVeC2JmhwlV7U+vBYPyEujyF1uknBmAN3rQD7vw1jOyGcbisTJOeGY3tt5/PryZe5KcVOLcjBLKBQnUPVQroKolcezezN0TBOqbR7Hu3keBLdson5Nc3n8/6jpwD5Y10JKnFSwJdHULrHyhhZmizpmsonWrGuy+8Djwq6/RAwevxyGlGrypEvb+FjBT+OdXY6AalOSPad9f6Ak/gwAEGaTyxsyqBG8ExaPfKGRAInPwjwlkxYgWdQT5vufLYGERaZcrYrs755Rb0T9XVtaf9wfU00ThfyP3sVEWB5Y+62zFud17kwyUI25FBSJa0JhRNhxtSdzGx27w2QaaQsmun/Ho1okoQ0CfP+KZhzT4JRcYCkaelwUwIIB+CeoXkO/IQT+rgJUKP3vOYsw6lDBhNlu2gDeoUctrmrpQctcEi7ptYMVmhVWupN6r/gvPf+9H3Nw2SEHlMFFG8tyTTqDsmd+A3ZXFpBKhVWW8/bU2mqIP9z5Uh1sGaMZCeNP2x39u28aHvtMlmiDBDfbRtq0aGNb+HZ4oQdMlMEHGvfEqKBcxASxu3ygodLaCgisKCSEomTgyhpb6VdBkAOowoXTBABxWoiTKaNnH/OK2oT/+4MO9A8BwfUfMiexwCnKuj2jw9kZm4u+fHX4erb6PUy+AFiuArORmT/HYgOAWkW67zJxIXIUWpzNLPJ6o4L2soKxjhgU0td/ItNYDP+mCqw6QIXC/gL2bxLY+G3cNloFDD0Nu5kQ65IAcurNEyzYxb97MNGU3Qk9WYdEBku8//6f0xNe/CZowmWTvQNiNSMxMK6/6DQY2jmLejy7HFEtgYCbhhfXA/X+tQa8fBG3Z7H/4eYfwrY/ei9EX6+i6uwldZ1ABoBnSz+xPlH7JvGIfbHACcDtEZc2Fzok9KuYD0+GVMkYjhvChSf1l0mwxjz/IhwNLzsya9JsB/Kbm6H4A63bE2pMdTkHOC7zYjNWyAHha4QTRYh9dogizjZJVBm0udQQxiaRV8F+CdA3jMtomNCgEfJsGqDzNAmbbfv/4Fg+8XsFby8B9Dh6rZTCYmQh7tz2Rn5rndS1BfZMFjpsObBoGr6toquYlRh9bRusuuhhy6nQfblVeUB3rm0h7+gxsX7wYk2/6LaofeC8euL+FLWsUMFIhNB0gnweURzR9D17/4ACWrhnkI+YTeKpNcpr0XSgPgMe+UoTbtya/Xz3s/SADrRUhnzejYxOJNpg2WDycDW+ai2RZSoLfO4hJBFogrcWxfBIyZ1VdOncRLFoCL3Wx/g757gcmFZ/bXK/y90oDWmB/+K0WMuZX7iwciXoGQ3LZmOMmmTxsT36IBJSfhLc42GnNXlENwNF+OTkBNEn4PecLAGwiLL3JYhQnAlYRw6uH0ZzSg0dAmNxH1FsE5k/UqBUFP/qL38JtKNhlQdpVBglusGl7HlDu5rW/u4Xw1vei3G+jb5INJXJQ3mRs3eJxfd0YYRWTKkzgZbWVOKLpgpcp6Oc8kBfs4BIgyX7vfBZ+3VXJJ8hmAb9HJUMMW0RuUqJhg9EWyrVtK+ZAFAoZ55mii9lenxWSb7eYrSzNxDG98zde29xy3IKuLiwZG0oV5O+IP0rC7XliudiGk+TBIieLaCoFCvo+wpKSYIMyAvMoyKD26a+mRfECrirF/iJy2Xc/PAAtDZ96J/jdZb+d1QvcEx24XWz2jRA4YPWxC8DqUQZyRXDLhbdyPSrrhlGZ2M+bu/OU6cnC6hHYczegsWIlIZMFKx1W+gVwsggWERPZGXK3bYes1dkuFWhsjDEyotDcVIEarBKNDEO6ipEv06YhydjKYIeBIvtK0E1+rFQWQIH8MniLwnL9qHYg2QQVbvthfWZ4XhxtQMHGERsShjEOIhqiQJ2juUIUjAkMD2VhwcNrfvVA4+qD5mamARja0eKQHUpBwvWczbuFp9ZUNsHqOywAojUzpEkrYODwbHBRtQP7MSQc7nKSACmSPL0RpZVfJk5ecINVALt4DHLZb4l1/O/wGGgBaLGfOXd8a1TVBFgWuDrGlM0SCQ9cGSOXBLhkYVLZAhFIq7B5nnzqxch90QHVFvmJbk/DUUyOBqrDGq1NDVbbG4S1m8Bj24HeboIioFcDh9sQtoDoDRRCwnffomQfm3D2eAMZYmVBgrA3LPuM2Re1UWQS0sGwgWbFzLxxlM6mmQ5K8hWOBHDltlGvMK7XmypIJ+Y8NMYhE9ShUOwjO4jDwLbbSu2zNNEOOHJ7CGowQEfuQbDhWQCyxiAaMoLR9j0xUCqhAbgElIH+hgU8OgZy68ROyydhmJzDzN3zvHAfmyypQd3AhpmTefh+N3AaQ95dppAql4igW02W0/bENlFEH2vafRZBTy5gZDSHyvwyjzy6HHq4QiAFUSPgeY9UI1AsyaAMQBn4IIMNcCZo1bUAkgALEFnCZ4AEQCJo7xXk/yyA2G7D4IEnJKe/UWQEjbCdkoPdOvLlIoiNDmBAnK1NRvpUQV7WiDBAZ9cgeBEsAAsD16ZzxCabpjhM8iK5a5mjAZgD1ywxLoDCEiMalx+dk3M62XDS42qjADYlQDHP6QNQGyS4ddjlAcw9eh7mHNAPuwTaOsioDDOqOSD7xrewvP53ofolpxUSQJYFXath6ntPQqkPeOZpDW+LC1RrRE4T5LlgT0O6DUZjDF1dDNgMcgkQDJLBR/E4anKiEMkK3CwSAVQnyf/ZChA7CnrhfQUhFgSSwTWwyK+EM1DCSIWIwsCfjOWenD1kFjC6DE08W/ykq0fdoviqD83KfeSaNc1UQV5Brv4QshtfhMZHi/0amCYcjpUh9mvjhp2wwSlSHwq5AwzN4TYa3cgG+awdCQw/2vR8SJOTwwdNB47MMu+AM3evGQy4I6xGtqIweTL1TMry9vWjtHbpGIYGGd6UfhxyiOCu44+kzSeehOrPr4WcOhUkRUTKxUrDXbMGU078J+p/y1s462kctqfAE57F9TUV4u2bwV4L0B60UyFR3Yq9j5KM+XmWDUFCBtdDILaS3GFdxx2axWz0gXBUqBNeysTfI6WIm87YLHEfx3uOXcmgRkuQKINpysiIM9Yoj+RDvDBVkJeRoXpXYXNTNNDkaaJMeaiQ7j9oDGwvtjYTuMk8ubEciIM0elsCxeiG022JRSQCT5/9YxxrF7jfLAiEFuGAmRrTyiPYuOUl1Hun8sNXLCHYJSCThdhzJs/Yq4ixqocnH9bU9/mvc29Xnjf8129INVr+zqsV7GKOB049BXuf9yUaGmYs2wKyJHjGVEHDNIm3PdwANq4lFAqsX1rOE3LDWDiJgJrwP5AXrFqRAJ7MWI2jYLqtYYziKoMk+65Ji+0rA8WEvQbo2w6yJ6eptHvTChmyUOfZ92xo3nfETFHocJBTBUnua5TxsusquWG4vDcEAJc1iGQ0FTzu4+D21jYA0Xij5BAZNqyJ4ZexYQySNzAx5Wacm+1DQGwUaQCsFFF3v4c3H+DhJ089Bzn/UCitmewMMKEf1FXCxse2QbkEa7ce3qPHxtiXvkKZt/4z55Y/iU2rh7h7Sgm9hx1KXQvm8OotwKQ8U2a0iS0bHRqWGj1dgmj2NGjBkKNDpJc/zsfMV+jv1lCjICmjzEUMvUa88GQgHGYRoYEOxlakfelT2ywgJjZSURHJa1xkMm4+qj1XJQkg2n3VKvxl4z4qm8K8f0NGq3Z2xYqhEVg9cyApcp/IiCvMMlJjiFhbjj2ipYlXcifo2D4b1hhexmabbseUpahAz2ymIwB14JPHalx17wvgzcuByXsSOy2Gq6CWrSbUG8C0mXzgbEEFy8P997RwxGvn0ND8ObAqwIJZwHPLgOKIosFVDjKzs1i4wMbIc5vQqtZ4Owgo2L5F3baKeNOzOPVDGvC0n+Qxz4mTms5RXjAxuTRqzqe2TcGYkZi8rJqivxkTDWMabQP5int1x1GPeMbIVABeKWMXfM6kHQfJ2mGqecNrOKlkZQG4YJpopKJM8uUkVU/ICRtUmXIH3xXHnE0h04lu487SBkeUyTebyP62f8VrIeSxlQSoOnDgDBfvP7IB9chiWKrBaNaBzeuItqxnwRq77VuimVMFHrlrGPnRCioNxtLHm2isbyAz4qGysoLRGkEP17Ht2WF0Tbaw9wElYPswico2YM1KyG3rST3wexyzdwXH7eFAVwmSggtgMI2QkagjjP85IrI4tFGQMpKTtRKk10YzTdxfEzPARH0j7VB6273zod7ZANxB19nhMuk7jIKEO8aT6ysEQIFoICioi7lxzelGiUUeOMSamXysP0p8kQZTSOmviSliME/865x0CzB3UgPB5JCicGxZvACYiKDHmL79riamWCvgPfEnCDtDVB8Buw76Z5Sx58IyVj8yiKEH1wBSYdUaD9hSRXPQw5qaBWewiqWPj6ClGNsfXodNLzYw8/CJ6JleZF2tQGSzhOf/jMy2x3HR+xVEQ1Hb8F5qjwQiOtb2XSlmUeykWGUkS3VCwuxQqbQxrjrkyQ9HzXUcj9oJtOOci0QJAE3vsu1UQf6GBZk+MbhIiiaaF9IkdKN23iad3N3CNWzM6mvb9RI3P67jSibRkiRy4+++FHE6+x2MJMBglzA569G1Z7pkL/8L4YW7Qfkigx0afmkzHv7N8/zEjU8zUEVt1EXlkTXAhs3gah0rX2qgunEI3qqNcOoec3UIz/3xeTTqGsU+m4hsWC89xOq+G3HJR1u83+QmVENAEvu8VeOdp345KzjenJRxiKw5tNDG8TRH14eMOSMU0rmanZ4aSSpYbbi0igGmvoMAua2y47Vf7HAxSJ9tBSg755CcYe4Png1SE3GIbg6jDKKOsCTFLDsxgungsWS23SyZQDwinJJoFdryLZ3xDAApGF5F4Ni5Db7qM4QPXfIHUk4D1j7HwqvXePsTL/hHzeaZN28h1GqAFPCKFqpQjOowwXP8D2Ir1JavxH0/aEC3HMaKO8l56EZ89yNNfPI1DXjDPsKVAC/iU4tigTBM6yDG5Y5ILCZbAIwB6+NEbWCjnLoDUeSXQaPIsNt+tQJz6ZR5EM+MuQ7STPory4aK5+8vEgV4vovFlCgvMQvZKRFrJgO/BCLMpg/uMzZw2yIhIygNV0uyrDXQReJEAobiTAFH02ItweQNE528bx19X2H+0KW3Y9vGNWwd9kZw93QopYCGS/CaDKUJJEDwmKtdhFaNqdUEhhjkuSxsicbyZ6EeX4zs1sdw6RkeTjuizt6gIEu0DQBqg7ERz32HMQo7mUdqG0rabtppXOeMEj01UTbdQK2YTOqgthZpU30cZKYMQDyTycKv2UkV5GVjkFoTGoCAQjbR0mmCsWZxiY9YckinyBFbSUyFRdFk46g6jzsy8txeMG90WaEt0IUJb8XFXsbCY2bAEoA3IvCmOU08+E3G5695Gr+//SVg5gEQc/eF6J7EOkxPCAFUxwjNul9gTApUGSQe2cRq2cPAmqdx2Jxhuvjrmg+f3oI3SLB8izrOio1dGDbGtRtoUrv1TBQMjPM4ktcvkSyKkcXo0lJ72QiNmycJ7m84JMtVvMO1gO9wFqTuRZM2ReSzEsXm3KzIYgO5NLFapgRgG99JtHfxtJVpR72Jyd2SiDrHI1HCj4jb8YwWYO0zl6oRot1yTdxyBvEtzzEu/9MS3PPwo9QSUxm9U4GufkapB5C23xfSahBGtwOD64Hmehw6s4ZPfEzTKYc4sFxF3qCAZXGcFUrionHVTGg02if5UmxFzGQIYZzdfVzlaHfRKJk6jV9PiZ+RsFaJSb+1LDjvEqcK8gpBOgHoyQaVPppasYIYi46TbkGANsXFjBwbgGDcYFycaDZdBC4AKGAppwja9XOQHHZlgcdzo6NFY3ZxB4VZ7X6+FAztENACvW1+k9+2l8RTmzwsfrZCD65ajtVbBA9utcCaCKQxkFc8a4JHB+4PHLdQ48hZIIICKv6kN8viCIQw8hHcFnNwshUg6GyJXc0ETahpPdpcIWoDvM3MeOSJcliYptnMn0RbRkfy1hxiBAJeAvQenAbpf0tml62gWwGNWEGSO5rRq2Zk6DimHQjuS9w/wmTcx8geEI8HfXL7UHAaT53NHTXaiZk7HbRgUYjgNL0KkYDGfj2a9zseBBLwWoSa65DWgJA+6aGd9Rsn0AJh1J/CJkVQ868NTlAeh6Cbk26SMSCdEijXK8XD3PETJT9S1LVCAdMlWLebHgqjE0pcT5MB3ne1qo/b4J4sy1RB/obYlvKL1Ry4YD9nJ0JGEoOxnZJdHsFjRGHuIq6RDQstjIpfneDbDOY3m4gXmQ0nSVcjZqtlE8lig+U8Yj1nkyXbh0Wt4KCqAeK6v1osoambDL/cAekaQYFI+BaIraDfImQtTDCqm46hgVi14xeR8zqOu5RwktgoV+lsJTAJ4ImM3vMEQ0bE6UpJH6EdAiCC0LzlshXwLji4AyZLFaQ9SH9qUPjZVCXGoAHBzO33mZKTXdtvSqffHLTNhpwNTLFlCsl/yHCSkHTZEi6ISTLH3LZfJhpL2aj5bi+eZMjQxIUv0kltJGLYSSAh/IENZC7pQo0TWI/zOyVgpbb4JbEwNbf9KYnwkqkRiXglqvVqI4Iwf+eYXMZjB4AerLhOakH+Rgwyq9uWADLQep0/HSaONAwWjaQzbKC2ZkVitDJ1nAgGA1KEQTTBC15nSf9FWpG/Ltrdq0A7JCWXjNaA0qHfxiQFQYiOItnEZs7sv4cV9MSzpmgQbZgF0gwoFZ+B8GmsomMoFa9oKXxAQPE4ThEnzpsBkFJGLMfxMcLXehHZHkGK5EVQOrknWTLR62FwLI6zbbCJnVCMHBJtACB67SylMO/fsCBDY14LgAWNrSH7oYG9jGN/CdSGVY478EMDMsdABvBcAZeBfAawZNCT3iBAE0SGITIwekyMWFYDaAS0TyKYuGQxRCnYbQUDDvlfNP5uzhoQWQ2RI2jHn/eZlWApA62p+1NtRQYQRY2gFANokt+1GAQZVon9OgiHwA2/Y9DKcac15fC8CVr7fVEyz4Bl7DIegIaITIpVCI4tANTIbwYLAj+Z8xuzzOMmLrUxa74dBkMSCo9DPE3rANhKCTe1IH9DygW71TW9KwdHr4Qr2r2Kdh6shBJExE1xxEzhLi+KjCUbbPzkoQyWbZXYViHM7GPsM93DrG7GJ/ZvoTuncfOLNu5emeGszaTAUJ6vDF15xh4DGm9f6CKvGcohyKzGXast3LIsi1KOUW0SHznbwUkLXNIt8ll0jPXCChAF4MHNFn72cBbPbZS8rQKa1gvab4aH3Xs1Pry3g3Je4/cvWLhzZZ6LOVDNIX7D7g69eZ4LOIQtrsDFS3JoeoQFEzycdmgTD7xk8w3PZJHPss8aygzFhIEiY49+jWPnOeghwGPG5Y9ksXqr5HKBqekIzJ+ocOq+LQgXqDHhwrty3FAC1QbwqUOaWNjPpFyCzDCuejKLF4ckBDFPLDI+c0iLqBV9xI6q53FTjOZG5zHg6jWYBEmW2wTSTPor4iblhq4d0Gt1oaHWoslAEKNjPIw+0TcYjrMNmTeCMR8MlnnGTcuz9N6rinA9oDvPmD9F4cUtAvc+kUOxT+NDBzjolgyWwMV/zpKVZWgNlIqA5wH1mk9cfcQ8Dzd9pIZ+4aemi3nwJXdlybIAr0X0hjNdf1NksNDxiWsFyCLjt8szeP9PS3AVUMyBdp+s8Pwmwj2P5dAzifnk/RwCGIUCcMldOZI2oDTofQe2GAzSHtBb1LjpmQy/sFzSZR+rAhLoLzOuuD9LDdePfYp5hpTA6CiBLOJ5ExV+/eEaHTDg4LBZGuf+oYCxum+BjjvAxWmHtaBbQBWE7y/JY3QL4f1Ht2j2RA3VJGgNyCzzikGBC27JkVVgymfA797H5WmWJu3F4IBZTs+c6EYwix8Z8Oepg701+5dLhT5HNl8mivo/kx0uc5mbOdTozbkFFLxNWuk6CKSZ/SrRgFo/rB7lxOgDn4Q6KGcPoU0mZngEfO+uHBMzT+3WfM+/VPjhz4zxk2eP4fKP1zGlW8MLaH0mFRldXcx9ecb0PsbD/1LB6n8fwclHONSVYzy4zMJF92QhCww44Fk9muZO1NyTZ/T3aMwtKcAzM8v+/4IARxN/63Z/rEFvEVh85hge//wonjy7wpedWuepPZpcFwxFvEeP5mn9jO4CML2XMbugCa6PYmUkMHdAkVVgzOtihkOYUmCaM6DQXwJ68oQbTq1h7beG+d9ObHIpo2nVVqIv3pyDZoEjpjh842k1FLOEqRMVHlll4c6VNsREjV88lUGtQnTEfh6ufl+dCy1/H5L+9adVQ5JyJcaUbkbLAd29ygYy/mZC2hykapTC6+S4CXMKrnbYgyc3LJwsy/mB0caOth53OAX5xJVwD5nE4rE7akNCYQ0EQTAxaWJmJo76EXw4kiNOJyazmCJ8TAhCyxG0vUooZpmaHtFDqy1UHYHJJc1nvLaB695fh6WYof0g1PP7j6CZuawUJmY13rm/y9UW0FXUeGKdDKc3EcOntnI1BcE2YjbzsG8kgF5rTYHtVcGFjIangSc3WKg1CVO7Pfr06xp07cl1SN/q+JRdAQDgaYLrGdtwEMB7muAof59WmuAqglL+64oMdLU0Tj2wCdsCuvPAsq0SQzUBPSbo2NkOPnZki7eOCSjF+Pfbc3h+0MYld+VYWowL39Yg22XyPN9NEhLYWLFw94sWevMMx/Mvwc3PWgQRNpBFvTHh6AMmc25LcgY7QwBC6y1b7xsZ3L2srY9cg1aqIK/sYxEAZJHFwY/BRYufDXidNNjPIxBztFOxNqZEMTE6m32gFKiY0/yauQpDowKCGGden6dDLyrTObcX6PFVFh8yx8WkbAAD6UQlBFEeGPME7ng+QzkbqDQJM3qDGcqaINifyBy6fILC3TMRmEIroLeg6dDZHm0fESjYzGfdUMChl3Tji38s4rGXbBww3cGAzYCixKzMEHE2P5+nTRrGiLk+cGuYPQlWecKtL9rU8ghNz4+jyjnNRAw9Bjr32AZmT9SQkvD0BslvvriE9YOCzj6hxUdMd9mrEVsE1gpAjvH7Fy1s3i75S29vcd5m5GzgwdUWbxkVkNKPe/wNgcNhPCHzVzwyOsxpaXAweffFSUtQ6yGWGKfYOFWQ8U6KPQdABswPh8VsQX6MuC23EHWyBY08ZnY87DnXNdB33lSjk1/ncN0h1hpYtZVwyZ+yWHR5mT57c4mbmQCaZ83MIElA3SG8+coSDv9uF657xELWAmb0Amcd1QI3owxm5EgJIJ6zPg5Cp+vARf9Uw9sPdTHSEFAaeGkb4aI7c1h0aRn/8ocyWtlAPZmZzO7FRH8GRzrTTu3JALI206dvyNOhF3bTF24sIGsxJBG+/IYWsoKhNYE9Ql9G41tvaaDhAFmLafOowBF7ePjXoxqkRomk9PckEdjrqx7KYo9pHj6zqEEHztSsNHhrhehPL1lAjqE1xQlXpvYeGz/rqynchIJaLL4PgK3ljodg7XAKEmIezaYenTq1XIaHJ+BqCIaIm264szNNh6NCgkSgsdMKBgQTD1ga176zSneeUcHnjm9hz6kalmQUbeDSxVm66vEckGcoJjJzCOsHJa8dJBSzQMMh/OSDNezZ78FzYsKGmDQwylV0NCcJgAUD03MaN72vijvOqNDpRzuY2suwJaOUAS76QxaXPZADCgwVkHWHXKo67OtiQAd5k6j60pyCBf8cto4Rlq6VyEjGWAM464QW3n9Ak70KkSSGEICuEN61h8OHzvZQdwBXMU4+oIW8YH+ENPvKJLKMR9ZbeHS1xLypTLctk9xb1hTyy938rM0QxII5GYhrY8RdoiGLCZoIDgMtvm/u3GKPUl51R0OwdlgL0uqrVF43F/0YUs/ohq6ASBD7jlU4OSpUGIp8/rA3mmIXLHB7ttSIbl1tAwQc1uPRd46t454zKvjUMS3UHaBY0LhnRTAvPOih9hRQzIIf/1IF/3yIy8N1v47+5iftoBiDggQ4RfWU/lQBTnTqRechmDY1BX6/wmZI5tdNcHDxG6u497OjOOUIF9UWUC5rLF5mM5hgBcQ6QgA1B2hogIRvIYUNOF5QTiCQmLVIABotP0j/9rvrvL1KKGWBW560eXRUkBAMzcHcD19xaVIRcBWBiCAUwF7YNkvMCowM6JrHM6Q1cNvTEm/+jy762ZIMMha4aDPuXWHR2iEJYYWcxZTo+iRjGhUz/KleBKnruo5t6qljp7o9E2r1kR0NwdpRFYTOuwHOgNBZuqq6jT08BougdVC0G9OJUkdPOUeRSLyrM2BlgNN/W+DvP5TjStbPzncVND54oAvLApouoTvPEYVKUBTIHgP9pPGlo5qUtcGlLOPqhzJ4eIMNO+dz92oVphPJLAYhjpSEA7SNICX4k78p4fx7CxgVAtDEk3sUTty3CSag6QFTShpQwKQCY1KJWQXv8dPHs+xkiEUX46ZlGX5ho+RSgbF7nyJ4IEFgQb5vJwRQVuAzDmlh9kQNQYyn1hJd8VgWoptZe1E1TTSqUIpgtraIx4ZoZpI205aK4N8+meEFkxVf9r46X3FKA1eeUudpvX7V5GCNcPOLNpBlDq5HQhn8+0Zm+6+GRWCPn8DPalunlezcR5aguQMakB0vURimNwaIXAAZqfTtgDhahDllNolBIw+E45FsodceTEXSzJYEeZpw1nUF+s+HMjhytodsBrhjqc0jFUJ3CfTxw1sMx7cBjRbBshnNFrCtRthtkocT93Nx7UM2LAmcdVMOd53mIiPAygUqDUBrprEGcUNRGzNUXIMkBMPzgK9cn6dfPJzB6+Z4yNoatz5no94AukvgM17bJDSJc4Lxmde18LHriihkNC7/S47ufsHmYo7x15cE6hVBnzyhxQsGNFAhkM2otwjKY9QdwtYmQdoapx/R4rN+l6feIuP8xVl+8zwXe3d5UC0Kqg4YtRbY84hcFxitxfkKrQhWl8b3bstiy2ZJZ5zU4tNf1wC2C0YvY8UGie/cmUUxC77mkQx9cv+mX4wZzrQ1XNBkrQ00CFIS7iCALy6IxrhFEqkFefmSkwGLtr3zoIF+uN4f0ABrJisoWAovMiUYOAISAR8KDooTfSog8lzCgskaRyz0eFtV8JX35XDZX3LYWiM6fm+Pbj2tygf1eASHcOcqiwdKjEm9TNks01/WWIAifsdeDvq7GXMmKizbRvQf92QYReDO1RKZLGNKn0ZXQePWlZJhIc7JGOfousA+MxQdNN/DYE3gyvuzdNlf8hhqSBy3UPGtH6/isAke6xaRbhB9dN8m/e7UCh8yR/OEbsbTmyU9vEZixgDTN05q8kVvrMOrECHLtHi1DUXMU/qZ+7o17ltjAXWBt813MXuy5oEuRi7DOOMPBWz3iAjEwgIe32hhzRhh+oDGlD6F+zZIbrUkCMSWDb53dYZ/95yNKdMUttcBb1CiURXkjQh4BEzsZcwY0FhfAS56NAfKEitlUMslYsWoBluioYEK/3HPqeX+4UEe3hHjjx31nAAA554LMXp3/sCLljQeV1/oeVqWrL3gauVn1oMSLCJOMAWQz8QTUYYGj3sARD6IRxqE7Y4gDaAvy5jRpRkOSDd9rH+7JlhW3GyrHaBX+snGuognhdabwCQbGNEE2ByNUlIOoU8GxZNtdeceACsLOEzY1iDe3iKQIOqxgZldHuAAUYlKWCKT14AU2FgR2NYgZCRjVpdGIaMZNUFhB9SIR0x2TDTsOUC/ZCgCqtIvwREAmi5xmYG8YAIxjylBrmS2AnpwTwHdYSElmEc8AbYZUoBcF9wvYkh7SPtNkGGtVrPpT3yjCHQ05kzFvR8aGRKqplbIB4YXnOkV9jpqav3Z99wAtSOuwx1ywhQDROdBf/EoUgRIdtRvIOReQagnOFr6iZ4No8GO45psBDc7KKqbIhlTiir2k0f9sYZS+LMzBigYnhN6SNI/jM2Mbh07Al2270/3Cu13M4UbjoxzKeAEUQIsIqDuD3SaZoGmZXQcyI/5686v3/JfKAB4NQELxFOlpqndwX7QJHgNQVIEtZQa6JXszwmJqFX8w0hN6Naxm9Plt0+G70FdMuARiyqHgxBOA8REPTIsLQ6uqw5yGdqfb+oX3/oH77bCGCPRkx5Z+qCYVENASFf/lpZA/dvxpN9zA9Q4PfWpgvwtszaBxLq375WbjCZfrxv8deFPtUA8/SgCWmHEI2ifJxlyGxDA2vO7V6OSUgoCG00J4AkA6WAtkTGeQFL83joooxBBbapW/mqQIiJwg1ZBl3zYzxuO1vAD5aiULJwGxzpow4iL+liLYKZgK1CioHxdewG0LBArZehd6hg40ByXy7MOOo85GIdoDMIWhEQnWcCHRTGeTDCq/YPHwu7lcLoXGcwVYadlNEiSQSR0Q7Ooe7/40KLCpIEytuzIrozYQc+LAeDsJdXtr50qu+mK6lI01P2wQVpDUzgtKcgeM/vTbYnjCUph2TvpYCFqgLW/tYnAMIiQXC46XvA69vF9qwxYZYbsYshewCoEMKu/qFl2MaximNxk/7mFkEDbh01liWF1M8kekOxhiFxwjKiinCHCpGCgIDIDyC6G6PZfKyyOni8pTIAG51VE1DkVwlJCgqLz7mHY3Qxp+59PBC6oyDNkt/9l9TCsbo6qAMgsDTFI30QIbgfUosHz/PofHQ2NjueRhJAuB91lChoWCE31KP2w9txeRXvyln1r23dEeHeHtiCRmwVwr21X5s1DVrh8ORivFRoMwYn+ZkpSC0TcafHOZXhecd80M/mj1s1pHxoMIcFbHUFfvTvH9RZT3SG0NGHviR5/e1GL4ACrHYnzbspgtwHFXzvcIddhfGFxAbms4n87wqGMYrzUEDjvzjw8xWg4AjWXcMJuLf7swS5UnSAEiAwGFq0ZosRYvNbCFQ/lMNIk7DVZ4ZMHOlgYwL/MYLKY1jaIv7I4h936NM47okXc8j+alIxlYxLf/nMGDZdQbxFm9Wr+8AEtHNinoRoEmWd8+9EMv7DdolrTryPTWuMnr2/RxGyQJETy0rUZ90RiMiqubmvt7eAUCpqkhaOvmD4debfmeeed54/coR1UQXZUCxJl1Wt6ZPNbJpZng8Zu8qpqPSySWkNDE5v1VyHFKIdoiaY4gxsmF5k5oukPrYqZzAvfOQg+b3jSxv2rLT5wjsf7TfG4J89gTVAuYWa3IgHw128o0L1bJd+83uZLbsvysTMUMgFy44Bx9f0ZPLVR4oBZLu8xwUPJSvIGh+esNCDyjGufz/AJPy5jU4WwzyyP/+tJG9+9P8eU8ek/tQZRFrj62QxdtySLC+7K4qlhCUiOOiGbYFx1f5Y3jBBeu8DhPyy18KZrStjQlBDEhAzjr+skrn4gg2l9iveZ5vLMLs2k2GAUCyteYFbhchRjRH8n8tGqwIGKqxz8yoawyldDQ5L0KmorrMqvT5hVnNuN2kvmvU4V5H+gJ5+9Ha1yVlt0GRzL0T+ABRI66CgPKmWNbG0AAzOH2VuKSa7JUAqKaEiTxMphBplsYvQVmCZ2aew+UWOPSYrOPNDxA3jBEHXgx29r0iELPP7w9QWcfmMRX31ng96wuwfXBwRYAigUGFN7NM/td3H4TJc/srcLtIikGSz5zPDc8AS+fkce+0xXfP8nqnzJ8Q1a8ekKX35cA2j4K8kS4JEG+JpHM/zNf25gWlnjBw9nQLnYFcoKwM4yjpzj4VPHtLD/LIWtQ4ThRtzP35MDuoqKF05X2KNf48zDHEwoMbRHSUtgJmAj3uO4nMfgP4bBy0sm2bgfz/nulWh6P6MLUZtmsf3pJajuyEjqzqAgDAATstl1nzgsOwsNXKkregSSJDRrv7w6QSFDxoI3Ca8pIF8mHm98gkmMHeRQtPZLPbZViH71sE2/fDSDrRVBFJBEKxfIOBoXvaWBVdsE5vYp+vqRDquhaCoZsfZ73dcMCvz6sRzd8EQWtabv5+txrFfLBYYaoJn9ioRgwhChJ6+plNUEBdIKQF7jF0ttrN5uobcA9BSB3z1rY3M1IpODq4BSlvGrJzI890s99IcnbVz4riYW9iqEtAha++UlN/81Sz97OEtPbbIAyaR1ctGjjQCcjBKfzlETsRcWE1r7FlxIkmrMq4ta5ZLTDsrulrXkOuwEsqMrCBigz94+NDY5J3voZ2NDaHo/gE0UGO3k3A+OGqoiDgeGgW4ZtPwJqpqQldyYlyEJVG8SpnVrfOOtDT7/rU0Mun4VbDDbEtwk7Nuj0VdgzO3RsFmTXx7FER3nWJ0wf5LGv7+tiS8c26K1NQpZVCisVxJgKBfUndN4x94u//GpDH7yaBaPegKfWlzgCx/NAjmGBFBxBF16X44WTHXpl3+1UMoCQxXiSx/NgPJ+05gUwPCYoFMOcvCf76vDbRJZHKNYYHDL843tvxzfxKUn1jG5W6NaEbAEJ+IJah9XEGLnHERPzERROU04AiERrxA0FGwQtbwr6WfYMqUker9yZ2UQO9hM9J0qSG+PRZp2dvWHD5O7i5r4nrK9T8mc7IFiDu+7AeIYpoTaaXniQUshdRAleZUZ/iTmRpMwtY9p/Zjkd/ykTA2XcNgMl29+R4N0PZgSS4DrMU3q0pyxNLMKjEeQrWm6gudNUnhmg8Q//ajEFYfoEwc18a2jHCgHsEL2Ew6Sg3Xg0uMalAHw1cU5lhJUyoAOeV0T7AKUYdzwYgYVB7z4n2u03xRFzSbxcdeW8McXJZ++H2F6zi9nmTqgmT3grbs7OPFQFxc/kMGi6S7tW2TAJeQyhAklzadeVyDFgC0Zf3l3HSU7CtJ9/eBkwB7TGyMxBY86p0bF1lmQUFWvLrfzBR85ODvXUXINdhKhneEkQ5TjwuN79znrz8PP8Gnlz2FC9iI0tQeCxfGti4ciGJ/OmC9mMk5TG1QTw1sAaRA3rKD4j5hYAFKDsyrmhScAHgENAZYMFDhKB4AAuGBuSQRold9BZ2kiW4HN8QvJNnsGioxKU3DFBU0tBZW1DQEQUyUovsx7DO0RCwG0MoDjAbYCcgTyAHakfyI5TSxsoKpB7ILLAU1Pzce7A+4RIgFwVjEJTclTMqyBYVmCUyUeZx59ck0p9lAQFra1zqcfVr7yzUX5g7+6pPHXncF67DQKEsr1J03PvzA8Ov1rvZVV3uSepVZR7g6XNRNJX0Ei3kEyKK3DoSFE6AAniTvozMP9MSZ5Nnv7mJNXzmB0MwYqGPpHhmomiOXQxjIcrz+tASmDd9NEKqAdTSy/8ahB25dccmpgyM1LNF5VYEccEc6vM4mrjeHARh8MJcFdkwdIQxK8hhqyxobnnrE0O2n3bGv755dgZGdRELET6Qe954b1DYtB+y2blLOafIafDgabXUtsJENIBzm7cUepcWKKlJ8sNJaxBmvt082yjokHiDvHlHEQkMd91xQkKJn81/qojzZBAnNKg9EiDO0nA1kTtBLEACSYO+cxJuMvjj9DOG6NWSPO++mgRTnsy9BtXwnkKjm3kDrRLOqk84lpvo0GKQ0JYdW9s+k/UZ8A2fX5JRjhnUQ5djYFYQDU8iqr3jOpuTv9ZPTPakzdgJywSAc8IuxToBi1PxGqRYkA3aiVCnZUigPKMGYnwf4XjTP6jTQShARR9lhHM9d9RYm+wEYmOon8JJuLgoXIQQsvJQeXjqOgcUY7CqzjIZrR4x1NTMaXObWXogY04piF1VcYgzQDCZgXQcM5hceD9megqxHnHrqycs1XXlPYZwz157EDJwV3ehcrNMvfWVSYPOjpzAV7WXWVs5bJrOyBF3BoJZvBOVin5hyE2N8fl5I57DUhCmjoxr+fZokqoWOmRsKLGZcfnjpmm73snUm6RPwyszo6pzhR21igDviDzbK1iE+X2QQ42PDd4tbecYqV45NjYghoz1PKGqrt/eV12aFuiO4v3zm6incyBRE7mYIwADpnSX1zT0b00pXVUdl0T4dkgZDbgcl0F9rcqMRU1thlMabARr0mOjzWy0y6NVtrdSKbkpi1k0iY6US+JWRj7+jZNmICTiYwDSaXlxvOqQ0d1YnSkMSpR9WUiSGnCKp446mNMf9YWOFojL6NBxlFLlZIR40MJI26X6OrneW72XrazqgcO6OCRErS1PXnvrmosBddWfu1N+xdhSxZ0KxMsrL2eehRhh0GmUC4fSYXa0h8RpTw+bljEiy3T28NXC8KMgJBMSSh/X3ZoGsxWoc5XvgcjElmHmcqLSeTnMw6BgmCZF44oIZZ+8MaSCfdRNZJ1y3qy2QgGKcdJFwT04HZ3GiM8+KA3kgjR7Y37Nxr/az6nfOPKezXPVJbnoCCdzKXZWcUAsAXvqGrb6yFvm9MHFurJ3Q/KwrW7nBZBV0ZMLzleL6UwZBuVK7HLbzj3MiY6b8DOQp8b0q4UzG7PIcTF+KdM3Lzgo6WqDc45uBun1zFBoW2wVrPxmuRnPcUjq4Z56IhMeWpPckRlfVH8Qi1cSHHU4ZN+C78m4ZF0C1vRGxp7XPOWqBLsvzavc11O6P12FktSLSIzrpjbKgowKe8VC6LEe9duqWaIdFc28xVGBl2MooYY/QJyRZe47mBu8XjIUdkAAAxCar2g+yoRMMMTHSwxAwer5gdMjoP32oBcWtxsKNTPHucjPfw9UYb5SBJNsMomDYy42wWI4ZMMZyoTePwWOwXgBpVCqbFCaMdQRpaC7HFOZn+2hickhW9O7Ny7MwKEoWY5/xlbOWeBT2Frqs9J6qtD4JYQpCfigvciGgxI14gFA84MN0as9/dQJrCYS/8skiSAR0T2rNrxoKDMSEg6rzThlunOWpVTcKmMdIUK0VcfEmccHaiU6Uk2mUUbsJAndq8CWMkZBzuB/PWuC0DE70recjAwpB7Dv2qfvuF0/IHTB+ovYCdWDl2agUxbiA5R9eWXn5McQFd1fiNGnS+CpttgLwIwu1cINFunMxrsFnmTRGfkyYOG6r8gJ6N3ZMNaxPMv/DLvIPYJWJ7jFpdyYw3EkE5mbtyHMzHsUec6GOOJ9kmKpbj1U5x1S23Fx2aFbow8zwGVJ0o7IwVIrCoCevjIke2HnR/TP9Z+e73F+UP9tzGc0GfOe/ka2zXkAtPQr6nVZrzsVuqS9VppYtFb+6zaGgXgGVUFiXiicQMJKPKu2PeGndMTG9X0qiAJZi7HM1n5/YmViNVQS+HQLTBxeYQdGqfl/gyNzIxZKpt4qiBUL/MacQlWIS/EV4zXOSFrYbcm6wrRt558euLe2eAraf/qbaVd3LrsSspCAHg64/v7d5oObM+d3vtafXx8rWiJ3MymuwAsGGMouJkiUdiCHiiMCQ+emK8M1PbUPJo0nGsZ35gba7CeDRmR2wcK5ahbcF4a+rorw/0hPz4359MFzp2RGHHb9uy5njafATjsjlKOxqX3pEDiU+X2/Sa4SAvMmrMvSPzw5E3XnhMZo9ektUP39XYsCsoB+C3Zu8qQjesajZfNzODd87NTTv8N5WffH0vaw8qWPtDkQcO3UkCUWJ8slHhG//JLLWKFxyBObGIQsWgwDs3aA/Y1DkYliR6A6NgkY0W4miB+rFQMM498pyC4zBFffcc0DOQ0SJLyTmLEVJm5C/M5ycqyyjs8zAAtqDSjYy5jy7yIqMr7l3yhyNvyh9V3o21ds9Y0ly7qyjHLuVimZ7IFYtKAyO20/vFPzvL1WnlK0V35uNowANYhmFAAkc1IGFzVzXgYIwzzBXJ3Td6HrcZNsPLoTC7SHExcTy5jI3dG+Ps/uZ0AIN4qiOnzeaJkjneOvoQ8Xcy7Gg8C5oo7qBpXyt+IrAgbT3m/EncMfJP35zSPdXiJn35vtaqXUk5djkFMZXkl4tKA6M56j99cWWZ+5HSd6zezBfgkoJigiAROTOUWDyxu5/0NjpKRxjJhcdoH9VM4Tj1hMIwMQUlxMwG9Z1ZFRLlOdo0MqE4ZHhkbb+3L9K238kYAR2eA0f5Hga3AVoEMhrOCB7ywlajzs3yx6Pvuui47lklAT7tT6OrdzXl2OlRrFeCf09eUt1e03r4F28r72FfVT0HQ60zAS1hkYBm1dF3DQPhMdyqVygQ5PHKPXyyzSA7yMZAV6PSN1q1CTQsRqbCAuUonxEWehip/xBJi5C3qHI5gojNYkU2ECkTEIZf8UzECCFcIrM1mcLIQwdE9lmyMeRcaf149B0XH1WaX2s0aVdVjl3SgnS4W8f3djfImfG5P9We5Q/k/0l1ZX8pM7KsW+wJEXVUxgARtbtNFATCbUiXEaUTU9SlSAEzT9ucURMHi9Icfoztu16+ZTEz/X5YH1UAIGSSDDPwFOXoE25h2IHCyWlNFJF7MxttyEExJyUaVII3jU9fQ8EmCSioEfcr1tXV83/4+uLelqNHTlvSWL+rKscurSAJJXkrCl69OO+Mu2rP83sz83RP7lpRsA5EC37wTtEwqgjFSiyuzmJWwyPnqGwEhi+Czlm8cTNXHJ8k3KZ4ocUKFJaqIJGSj+L5RNVJwvszy1bMMhqTqsocqU6JttrY62NWyAlLtbyqrLROoZ83bvzhGwoHgWndrgLlvmoVxIyUz10Eq8cu7f7IMLZdN1qteEeXL7eK1qlQwm8LBVtRpG4MLojWDrU1AUaxi+HRA4gsgVHjFW3fviKFvY0xNMWx8gRlhUYoEAPEwUwBTgx/MHqLzWg90aSYZM+Ln8dob7A0dxe/cCUHqaruk3JL8/10k7P6+4vye4+i8cJ5S1Dd1ZXj1aIgCfnRouxstnLi9DtHV7mn5N8tipkfiaw1gBargLFB+K1BncyBUYxDSXiY2tCleDKacYxQCaitNit0h6idFjKwNok3MJAvprb5KAmjZOYGxwMhYMJmoYsVIQMMDxmyAIauuZeKu8fO+dcphb5ZRAO9k2pLgwz5TtMVmCrIf1OuWtTdo3J60qmLK8v55PxUXbQvFjn5LrCAdtkTfjUwmWhSpxsSs6NECzwyKQYUFODEZhwR2QVTH9qUEAavHSVJimByxnM7uBbDaxG61o5ow0TDopmMDDAUiAhZEqrurpMN/Wn6eeWWC44s7pVn2fzsA2Mrx9kzUgXZJeOSg2CrgfLcoboa++q99U38keJ7VEZ+T+atGWgRwOwFEwvaKzWiuCRmKaCQrxpxLM/oWOQxfQoZ1scPB6JwnBMsLGEyPVIsNogTop4rQru1i44fQ7njdylGE59IIwMLngaa3o+xrvKvez0B5/SFhXkVZa/58n2jw68mxXhVWxDzRl/xxsKUhksTPndX7XlehCLmFL+sc9ZnRc7KosUMhkJccUBt9U/J5CIZ7apRCNyWV2i75pGCBCqRTG6ECQ6MUxsV6k5gzUyL0Z40TN5osyHXL020YUEAquo9JButs+m65v3nHFZaMD0HnjyxunxHnt+RKsj/gqJccgKyebc8awNZzfP+PLyWT8rsoXuy/yakfA+yEmgxa2YtiESoJIm4AR3uiwEUxeWR1L6QKUSEoybwCI5KEk4FPVmhU8YJSq/xlKFdUSiRQw97GS2yYAGqoV6Sjvr3G66uXPPjOcWB4yfrmZmMXH32kur2V5tLlSrIK1iT81/b3ZuX3rSHq7T5vx6rbuf3WIegnD8Hlnw3shJw4oluZhMhxovmzQKRZPkK2rPvyR3fz3XEFqWNe9j4ycB2kxEGJwoiw65ZFghG3lgkIQFd99YJz7sID9R+SsvgffUoe88uT4yd80BrZRJweHUvjlTalvdlx+enspBdv90iNy95anSE3184CDlxppbyn0XBysAD4IVzqliASCTZEV8+BDKsThsIy23uGqGtdCSJpLW5Tkmw2QhLOBp3YyEDQDN0w3tGKPcHeLFxHT2A+jmHZeZPkdCrtjovXbYCrVe71UgV5O+QcwEx8Q25aZ5nlX83KDcueWp0hD+QnQM781FliffLjJgLIQCPAe1PNUQwOCqqOadkEWIYpyQ1xrwRbcs8mKYck+Aabls71hweRMOcASVgQUAAqqWUZL0Ynnc5rqr/iQBx5qGZedMtqHrLWXfeY6inipEqyH/bmgCgH76+OKGmaGBFXY1e8VBjw9rDkZ+xe+E4ZOQpmuTxIid6IcifHaJCfsOgtsufuxsO9+MkY864gUscM4QUqJxs0ojdMITKY3a0W7Dg0zO6GqrlLZWe/hWazq/p186Lvb293V/cx52ag+MN15wNoWKk7lSqIP+vioILD+/qQxZ92xSLC56ztmB4eJTfiYnoLh4DiLdrQUeLrJgCW8Q0QP5AXa/tmPQy15+MkttYlWI0lxMGiSEgSfgDF0P3SXnQ/IwA34aWe+tt1zX/+mbAff8BuRlzc6KvG3qoy2lu/MRjcFOLkSrIP0RRrjgIdq1QGHCV7FoPx7vshdY2DGGMj0c3JmUPgGUfBSkO1xL7ChLTYAVjaY2qXgT96tA+n50w64pj6mzfKRPmGFrEfbSKoV1dE4pfBPgRsL4HDe/ho3/dWrMEwBFzi33vmkF9WUXa8Wj7WQ+NDbVBCKlipAryj1WWqxYht6GV7yctu7cQuY9u06MPrqoNA1Arj0d57kBxOkjvCUsuhMR8EM3UJKYLoEsRdUsJOwpMhOFoBQqkNTSYR8DcEIT12tVbAH5RMC+F1i+iSqsPvqWx7THfSpU+uDDXu2e3VbCIWNo8WDm6OnTeeSFbcGoxUgX537920WK7/iRIDPeWxtAsbqyr8hYX/GxT1pesz1UwPFwPXa2/LETxoAnIZfozvVnJOUjbgqXz0DILSRqe54BFEyAF5bYqFWfIGUJr4BHUA6dNAMjPmlAoHTtLFeaA7WwBuoetKur10U/EAbdpLZAqRqog/2fXMVkzFV/c7x2OPNCVd7VbkFltNz3SsKC3jhC7JeH8YZ30duvyMllYjs5LlYNr55V/X5aNMe3Rz2IOsQUAc/LaWt8ATc2SRznZckezzZwaahjxRKoUqYLsvArTvoCvPAhWcwLElDJE9wjEqDOBMt2anFHBzYxg5WxRxW3QJz0Hl+gVFzp1DLJJJVWQnVRpgP/5Qn45+qtUUkkllVRSSSWVVFJJJZVUUkkllVRSSSWVVFJJJZVUUkkllVRSSSWVVFJJJZVUUkkllVRSSSWVVFJJJZVUUkkllVRSSSWVVFJJJZVUUkkllVRSSSWVVFJJJZVUUkkllVRSSSWVVFJJJZVUUkkllVRSSSWVVFJJJZVUUkkllVRSSSWVVFJJJZVUUkkllVRSSSWVVFJJJZVUUkkllVRSSSWVVFJJJZVUUkkllVRSSSWVVEz5/wBLRVPpb4vhigAAAABJRU5ErkJggg==";
const BRAND_NAME = "Sri Surya Eye Care Hospital";
const BRAND_TAG  = "powered by OptiManager HMS";

// ════════════════════════════════════════════════════════════════════════
// v4.9 — Ophthalmology HMS | Fixed Permissions Bug · Staff Editing
// ════════════════════════════════════════════════════════════════════════
const APP_VER  = "4.10";
const BRANCHES = ["KKD_Main Branch"];
// ===== Invoice Templates (Markdown, placeholder-based) =====
const INVOICE_PLACEHOLDERS = ["CUSTOMER_NAME","INVOICE_NUMBER","DATE","ITEM_DESCRIPTION","QUANTITY","PRICE","TOTAL_AMOUNT","ORDER_ID","OPTICAL_STATUS"];
const INVOICE_TEMPLATES = {
  A: { name: "Standard Clinical", md:
`![logo](BRAND_LOGO)

# MYOPTICAL — Clinical Invoice
**Invoice #:** [INVOICE_NUMBER]  **Date:** [DATE]  **Order:** [ORDER_ID]
**Patient:** [CUSTOMER_NAME]  **Status:** [OPTICAL_STATUS]

| Description | Qty | Price |
|---|---:|---:|
| [ITEM_DESCRIPTION] | [QUANTITY] | [PRICE] |

**Total Payable: [TOTAL_AMOUNT]**` },
  B: { name: "Retail POS", md:
`![logo](BRAND_LOGO)
**MYOPTICAL — RETAIL POS**
Bill: [INVOICE_NUMBER] | [DATE]
Cust: [CUSTOMER_NAME] | Order: [ORDER_ID]
--------------------------------
[ITEM_DESCRIPTION]  x[QUANTITY]  [PRICE]
--------------------------------
TOTAL  [TOTAL_AMOUNT]
Status: [OPTICAL_STATUS]` },
  C: { name: "Modern Corporate", md:
`![logo](BRAND_LOGO) **MYOPTICAL**

## Tax Invoice  \`[INVOICE_NUMBER]\`
Issued **[DATE]** · Order **[ORDER_ID]** · Status **[OPTICAL_STATUS]**

**Billed To:** [CUSTOMER_NAME]

| # | Item | Qty | Price |
|---|---|---:|---:|
| 1 | [ITEM_DESCRIPTION] | [QUANTITY] | [PRICE] |

> **Amount Due — [TOTAL_AMOUNT]**` },
};
const fillTemplate = (md, data) =>
  INVOICE_PLACEHOLDERS.reduce((acc, k) => acc.split(`[${k}]`).join(String(data[k] ?? "")), md);

// Minimal markdown → JSX renderer (handles #/##, **bold**, tables, ![logo], hr).
function MarkdownInvoice({ md }) {
  const lines = md.split("\n");
  const out = [];
  let i = 0;
  const inline = (s) => {
    const parts = s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
    return parts.map((p, k) => {
      if (p.startsWith("**")) return <strong key={k}>{p.slice(2, -2)}</strong>;
      if (p.startsWith("`")) return <code key={k} style={{ background:"#f3f0ec", padding:"1px 5px", borderRadius:4 }}>{p.slice(1, -1)}</code>;
      return <span key={k}>{p}</span>;
    });
  };
  while (i < lines.length) {
    const ln = lines[i];
    if (/^!\[logo\]\(BRAND_LOGO\)/.test(ln)) {
      const rest = ln.replace(/^!\[logo\]\(BRAND_LOGO\)/, "").trim();
      out.push(<div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
        <img src={BRAND_LOGO} alt="MYOPTICAL" style={{ height:48, width:"auto", objectFit:"contain", WebkitPrintColorAdjust:"exact", printColorAdjust:"exact" }} />
        {rest && <span style={{ fontSize:16 }}>{inline(rest)}</span>}
      </div>);
      i++; continue;
    }
    if (ln.startsWith("# "))  { out.push(<h2 key={i} style={{ margin:"6px 0", fontFamily:"'Playfair Display',serif" }}>{inline(ln.slice(2))}</h2>); i++; continue; }
    if (ln.startsWith("## ")) { out.push(<h3 key={i} style={{ margin:"6px 0" }}>{inline(ln.slice(3))}</h3>); i++; continue; }
    if (ln.startsWith("> "))  { out.push(<blockquote key={i} style={{ borderLeft:"3px solid #d6cfc6", margin:"8px 0", padding:"4px 10px", background:"#faf9f7" }}>{inline(ln.slice(2))}</blockquote>); i++; continue; }
    if (/^[-=]{3,}$/.test(ln.trim())) { out.push(<hr key={i} style={{ border:"none", borderTop:"1px dashed #c8bfb4", margin:"6px 0" }} />); i++; continue; }
    if (ln.startsWith("|") && lines[i+1] && /^\|[\s\-:|]+\|$/.test(lines[i+1])) {
      const head = ln.split("|").slice(1, -1).map(s => s.trim());
      const body = [];
      i += 2;
      while (i < lines.length && lines[i].startsWith("|")) {
        body.push(lines[i].split("|").slice(1, -1).map(s => s.trim())); i++;
      }
      out.push(
        <table key={`t${i}`} style={{ width:"100%", borderCollapse:"collapse", margin:"8px 0", fontSize:13 }}>
          <thead><tr>{head.map((h,k) => <th key={k} style={{ borderBottom:"1.5px solid #2c1810", textAlign:"left", padding:"6px 8px" }}>{inline(h)}</th>)}</tr></thead>
          <tbody>{body.map((r,ri) => <tr key={ri}>{r.map((c,ci) => <td key={ci} style={{ borderBottom:"1px solid #ece6dd", padding:"6px 8px" }}>{inline(c)}</td>)}</tr>)}</tbody>
        </table>
      );
      continue;
    }
    if (ln.trim() === "") { out.push(<div key={i} style={{ height:6 }} />); i++; continue; }
    out.push(<div key={i} style={{ margin:"3px 0", fontSize:13 }}>{inline(ln)}</div>); i++;
  }
  return <div className="invoice-preview" style={{ fontFamily:"'Inter',sans-serif", color:"#2c1810" }}>{out}</div>;
}

// ===== Sri Surya Clinical (Dual Copy) — editable template config =====
const DEFAULT_CLINIC_SETTINGS = {
  shopName: "SRI SURYA EYE CARE",
  tagline: "Contact Lens And Vision Clinic",
  address: "Ground Floor, Arman Plaza, Maharaja Chowk, Durg (C.G) Pin-491001, Front of Bank of Baroda",
  phone: "8871439741",
  gstin: "",
  logo: BRAND_LOGO,
  terms: [
    "Working hours - Open All Days 11:00 am to 9:00 pm.",
    "(a) Order cannot be cancelled / revoked or transferred.",
    "(b) No refund under any circumstances.",
    "We do not guarantee any metallic frames / polish / colour.",
    "Your material repaired only at your risk.",
    "Anti-Reflection coating is vapour coating which we don't guarantee.",
    "SRC denotes scratch resistant coating and not scratch proof.",
    "Order for a half pair in photo chromatic lenses does not match exactly.",
  ],
  sections: { rxTable: true, pd: true, refBy: true, lensType: true, bookedBy: true, paymentMode: true, terms: true, balance: true, discount: true },
  fontSize: 11,
  paperSize: "A4",          // "A4" | "Thermal80"
  copies: "dual",           // "dual" | "single"
};
const SS_SETTINGS_KEY = "ss_invoice_settings_v1";
function loadClinicSettings() {
  try {
    const raw = localStorage.getItem(SS_SETTINGS_KEY);
    if (!raw) return DEFAULT_CLINIC_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CLINIC_SETTINGS,
      ...parsed,
      sections: { ...DEFAULT_CLINIC_SETTINGS.sections, ...(parsed.sections || {}) },
      terms: Array.isArray(parsed.terms) ? parsed.terms : DEFAULT_CLINIC_SETTINGS.terms,
    };
  } catch { return DEFAULT_CLINIC_SETTINGS; }
}
function saveClinicSettings(s) {
  try { localStorage.setItem(SS_SETTINGS_KEY, JSON.stringify(s)); } catch {}
}

// Build Rx + lookup context from the surrounding app data.
function buildInvoiceLookup(row, allData) {
  const safe = (v) => (v === undefined || v === null ? "" : String(v));
  const mr  = safe(row.mrNo).toLowerCase();
  const pid = safe(row.patientId).toLowerCase();
  const phn = safe(row.phone);
  const nm  = safe(row.patientName || row.name).toLowerCase();
  const match = (r) =>
    (mr && safe(r.mrNo).toLowerCase() === mr) ||
    (pid && safe(r.patientId).toLowerCase() === pid) ||
    (nm && safe(r.name).toLowerCase() === nm) ||
    (phn && safe(r.phone) === phn);

  const bills    = safeArray(allData?.patientBill).map(b => (typeof unpackKSheetRow === "function" ? unpackKSheetRow(b) : b));
  const ksheet   = bills.find(match) || {};
  const optical  = safeArray(allData?.opticals).find(match) || {};
  const lensSale = safeArray(allData?.lensSale).find(match) || {};
  const patient  = safeArray(allData?.patients).find(match) || {};

  const rx = {
    re: {
      dvSph: ksheet.reSpherSub || ksheet.reSpherAR || "", dvCyl: ksheet.reCylSub || ksheet.reCylAR || "",
      dvAxis: ksheet.reAxisSub || ksheet.reAxisAR || "", dvVn: ksheet.reVnSub || ksheet.reVnAR || "",
      nvSph: ksheet.reSpherNV || "", nvCyl: ksheet.reCylNV || "", nvAxis: ksheet.reAxisNV || "", nvVn: ksheet.reVnNV || "",
    },
    le: {
      dvSph: ksheet.leSpherSub || ksheet.leSpherAR || "", dvCyl: ksheet.leCylSub || ksheet.leCylAR || "",
      dvAxis: ksheet.leAxisSub || ksheet.leAxisAR || "", dvVn: ksheet.leVnSub || ksheet.leVnAR || "",
      nvSph: ksheet.leSpherNV || "", nvCyl: ksheet.leCylNV || "", nvAxis: ksheet.leAxisNV || "", nvVn: ksheet.leVnNV || "",
    },
    add: ksheet.add || "",
    pd: ksheet.pd || optical.pd || "",
  };

  const lensType = optical.lensType || lensSale.lensType ||
    (Array.isArray(lensSale.items) && lensSale.items[0]?.name) || "";
  const frameNo  = optical.frameNo || "";
  const optomName = optical.optomName || ksheet.optomName || patient.optomName || "";
  const refBy    = ksheet.refBy || patient.ref || optical.refBy || "";
  const bookedBy = lensSale.bookedBy || optical.bookedBy || row.createdByName || "";
  const paymentMode = optical.advancePaymentMethod || row.paymentMode || "";
  const address = row.address || patient.address || ksheet.address || optical.address || "";
  const phoneOut = row.phone || patient.phone || ksheet.phone || optical.phone || "";
  return { rx, lensType, frameNo, optomName, refBy, bookedBy, paymentMode, address, phone: phoneOut, ksheet, optical, lensSale, patient };
}

function ClinicalInvoiceCopy({ copyLabel, settings, row, ctx, items, sub, discount, total, paid, balance }) {
  const S = settings.sections;
  const fs = settings.fontSize || 11;
  const cellPad = "3px 5px";
  const cell = { border: "1px solid #111", padding: cellPad, fontSize: fs, verticalAlign: "top" };
  const cellHead = { ...cell, fontWeight: 700, background: "#fff", textAlign: "center" };
  const cellMini = { ...cell, fontSize: fs - 1, padding: "2px 4px", textAlign: "center" };
  const labelBold = { fontWeight: 700 };

  return (
    <div className="ss-copy" style={{ border: "1.5px solid #111", padding: 8, fontFamily: "'Arial', sans-serif", color: "#000", fontSize: fs, lineHeight: 1.25, background: "#fff" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #111", paddingBottom: 4, marginBottom: 4 }}>
        <div style={{ fontSize: fs - 1 }}>{settings.gstin ? `GSTIN: ${settings.gstin}` : ""}</div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: fs - 1, fontWeight: 600 }}>Order Estimate</div>
          <div style={{ fontSize: fs + 6, fontWeight: 800, letterSpacing: 1 }}>{settings.shopName}</div>
          {settings.tagline && <div style={{ fontSize: fs }}>{settings.tagline}</div>}
          {settings.address && <div style={{ fontSize: fs - 1 }}>{settings.address}</div>}
          {settings.phone && <div style={{ fontSize: fs - 1, fontWeight: 700 }}>PHONE: {settings.phone}</div>}
        </div>
        <div style={{ fontSize: fs - 1, fontWeight: 700, minWidth: 70, textAlign: "right" }}>{copyLabel}</div>
      </div>

      {/* Bill / customer info */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
        <tbody>
          <tr>
            <td style={{ ...cell, width: "55%" }}><span style={labelBold}>Bill No.: </span>{row.id || row.billNo || "—"}</td>
            <td style={cell}><span style={labelBold}>Bill Date: </span>{row.date || todayStr()}</td>
          </tr>
          <tr>
            <td style={cell}><span style={labelBold}>Customer: </span>{row.patientName || ctx.patient.name || "—"}</td>
            <td style={cell}><span style={labelBold}>Delivery Date: </span>{row.deliveryDate || row.date || ""}</td>
          </tr>
          <tr>
            <td style={cell}><span style={labelBold}>Mobile: </span>{ctx.phone || "—"}</td>
            <td style={cell}><span style={labelBold}>Address: </span>{ctx.address || "—"}</td>
          </tr>
        </tbody>
      </table>

      {/* Particulars */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
        <thead>
          <tr>
            <th style={{ ...cellHead, textAlign: "left", width: "55%" }}>Particulars_detail</th>
            <th style={cellHead}>Qty</th>
            <th style={cellHead}>Rate</th>
            <th style={cellHead}>Dis.</th>
            <th style={cellHead}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr><td colSpan={5} style={{ ...cell, textAlign: "center", color: "#666" }}>— No items —</td></tr>
          )}
          {items.map((l, i) => {
            const q = Number(l.qty || 0), p = Number(l.price || 0), d = Number(l.discount || 0);
            return (
              <tr key={i}>
                <td style={cell}>{l.name}</td>
                <td style={{ ...cell, textAlign: "center" }}>{q}</td>
                <td style={{ ...cell, textAlign: "right" }}>{p.toFixed(2)}</td>
                <td style={{ ...cell, textAlign: "right" }}>{d.toFixed(2)}</td>
                <td style={{ ...cell, textAlign: "right" }}>{(q * p - d).toFixed(2)}</td>
              </tr>
            );
          })}
          {S.discount && discount > 0 && (
            <tr>
              <td style={{ ...cell, textAlign: "right" }} colSpan={4}><span style={labelBold}>Discount Amt</span></td>
              <td style={{ ...cell, textAlign: "right" }}>{discount.toFixed(2)}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Footer left/right */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
        <tbody>
          <tr>
            <td style={{ ...cell, width: "55%" }}>
              {S.bookedBy && <div><span style={labelBold}>Bkd By: </span>{ctx.bookedBy || ctx.optomName || "—"}</div>}
              {S.paymentMode && <div><span style={labelBold}>Payment Mode: </span>{ctx.paymentMode || "—"}</div>}
              {S.lensType && <div><span style={labelBold}>Lens Type: </span>{ctx.lensType || "—"}</div>}
            </td>
            <td style={cell}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={labelBold}>Total:</span><span>{total.toFixed(2)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={labelBold}>Paid Amount:</span><span>{paid.toFixed(2)}</span></div>
              {S.balance && <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#b91c1c" }}><span>Bal. Amount:</span><span>{balance.toFixed(2)}</span></div>}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Rx table */}
      {S.rxTable && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
          <thead>
            <tr>
              <th style={cellMini} colSpan={5}>RIGHT EYE</th>
              <th style={cellMini} colSpan={5}>LEFT EYE</th>
            </tr>
            <tr>
              <th style={cellMini}></th><th style={cellMini}>SPH</th><th style={cellMini}>CYL</th><th style={cellMini}>AXIS</th><th style={cellMini}>V/N</th>
              <th style={cellMini}></th><th style={cellMini}>SPH</th><th style={cellMini}>CYL</th><th style={cellMini}>AXIS</th><th style={cellMini}>V/N</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...cellMini, fontWeight: 700 }}>DV</td>
              <td style={cellMini}>{ctx.rx.re.dvSph || "—"}</td><td style={cellMini}>{ctx.rx.re.dvCyl || "—"}</td><td style={cellMini}>{ctx.rx.re.dvAxis || "—"}</td><td style={cellMini}>{ctx.rx.re.dvVn || "—"}</td>
              <td style={{ ...cellMini, fontWeight: 700 }}>DV</td>
              <td style={cellMini}>{ctx.rx.le.dvSph || "—"}</td><td style={cellMini}>{ctx.rx.le.dvCyl || "—"}</td><td style={cellMini}>{ctx.rx.le.dvAxis || "—"}</td><td style={cellMini}>{ctx.rx.le.dvVn || "—"}</td>
            </tr>
            <tr>
              <td style={{ ...cellMini, fontWeight: 700 }}>NV</td>
              <td style={cellMini}>{ctx.rx.re.nvSph || "—"}</td><td style={cellMini}>{ctx.rx.re.nvCyl || "—"}</td><td style={cellMini}>{ctx.rx.re.nvAxis || "—"}</td><td style={cellMini}>{ctx.rx.re.nvVn || "—"}</td>
              <td style={{ ...cellMini, fontWeight: 700 }}>NV</td>
              <td style={cellMini}>{ctx.rx.le.nvSph || "—"}</td><td style={cellMini}>{ctx.rx.le.nvCyl || "—"}</td><td style={cellMini}>{ctx.rx.le.nvAxis || "—"}</td><td style={cellMini}>{ctx.rx.le.nvVn || "—"}</td>
            </tr>
            <tr>
              <td style={{ ...cellMini, fontWeight: 700 }}>ADD</td>
              <td style={cellMini} colSpan={4}>{ctx.rx.add || "—"}</td>
              <td style={{ ...cellMini, fontWeight: 700 }}>ADD</td>
              <td style={cellMini} colSpan={4}>{ctx.rx.add || "—"}</td>
            </tr>
          </tbody>
        </table>
      )}

      {/* PD / Refered By */}
      {(S.pd || S.refBy) && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
          <tbody>
            <tr>
              {S.pd && <td style={cell}><span style={labelBold}>PD: </span>{ctx.rx.pd || "—"}</td>}
              {S.refBy && <td style={cell}><span style={labelBold}>Refered By: </span>{ctx.refBy || "—"}</td>}
              <td style={cell}><span style={labelBold}>Optom: </span>{ctx.optomName || "—"}</td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Terms */}
      {S.terms && copyLabel === "Customer Copy" && settings.terms.length > 0 && (
        <div style={{ marginTop: 4, fontSize: fs - 1, lineHeight: 1.3 }}>
          <div style={{ fontWeight: 700 }}>Terms & Condition :</div>
          <ol style={{ paddingLeft: 18, margin: "2px 0" }}>
            {settings.terms.map((t, i) => <li key={i}>{t}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}

function InvoiceTemplateEditor({ row, onClose, data: allData }) {
  const [settings, setSettings] = useState(loadClinicSettings);
  const [tpl, setTpl] = useState("D");
  const [editing, setEditing] = useState(false);
  const items = Array.isArray(row.items) ? row.items : [];
  const sub = items.reduce((s, l) => s + Number(l.qty||0) * Number(l.price||0), 0);
  const discount = Number(row.discount || 0);
  const total = sub - discount;
  const paid = Number(row.advance || row.paid || (row.status === "Paid" ? total : 0));
  const balance = Math.max(0, total - paid);

  useEffect(() => { saveClinicSettings(settings); }, [settings]);

  const ctx = buildInvoiceLookup(row, allData);

  // Legacy markdown templates (A/B/C) still available.
  const legacyData = {
    CUSTOMER_NAME: row.patientName || "—",
    INVOICE_NUMBER: row.id || "—",
    DATE: row.date || todayStr(),
    ITEM_DESCRIPTION: items.map(l => `${l.name} ×${l.qty}`).join(", ") || "—",
    QUANTITY: items.reduce((s,l) => s + Number(l.qty||0), 0),
    PRICE: currency(sub),
    TOTAL_AMOUNT: currency(total),
    ORDER_ID: row.orderId || row.id || "—",
    OPTICAL_STATUS: row.deliveryStatus || row.status || "—",
  };

  const TEMPLATE_OPTIONS = { ...INVOICE_TEMPLATES, D: { name: "Sri Surya Clinical (Dual Copy)" } };

  const paperWidth = settings.paperSize === "Thermal80" ? "80mm" : "210mm";
  const isDual = settings.copies === "dual" && settings.paperSize !== "Thermal80" && tpl === "D";

  const printNow = () => {
    document.body.classList.add("ss-printing");
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove("ss-printing"), 500);
    }, 50);
  };

  const updateTerm = (i, v) => setSettings(s => ({ ...s, terms: s.terms.map((t, idx) => idx === i ? v : t) }));
  const addTerm    = () => setSettings(s => ({ ...s, terms: [...s.terms, "New term"] }));
  const removeTerm = (i) => setSettings(s => ({ ...s, terms: s.terms.filter((_, idx) => idx !== i) }));
  const toggleSec  = (k) => setSettings(s => ({ ...s, sections: { ...s.sections, [k]: !s.sections[k] } }));
  const onLogoFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setSettings(s => ({ ...s, logo: String(reader.result || "") }));
    reader.readAsDataURL(f);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(20,12,6,.55)", zIndex:9999, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:20, overflow:"auto" }} onClick={onClose}>
      <style>{`
        @media print {
          body.ss-printing > *:not(.ss-print-root) { display: none !important; }
          .ss-print-root, .ss-print-root * { visibility: visible; }
          .ss-print-root { position: absolute !important; inset: 0 !important; background:#fff !important; padding:0 !important; box-shadow:none !important; }
          .ss-print-toolbar, .ss-print-editor { display: none !important; }
          .ss-print-sheet { box-shadow:none !important; padding:0 !important; border:none !important; }
          @page { size: ${settings.paperSize === "Thermal80" ? "80mm auto" : "A4"}; margin: 8mm; }
        }
      `}</style>
      <div className="ss-print-root" onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:14, padding:20, width:"min(1100px, 98vw)", maxHeight:"96vh", overflow:"auto", boxShadow:"0 25px 60px rgba(0,0,0,.35)" }}>
        <div className="ss-print-toolbar" style={{ display:"flex", gap:10, alignItems:"center", marginBottom:14, flexWrap:"wrap" }}>
          <div style={{ fontWeight:700, fontSize:16 }}>Invoice Template Editor</div>
          <select value={tpl} onChange={e => setTpl(e.target.value)} style={{ padding:"6px 10px", borderRadius:8, border:"1.5px solid #e2ddd8" }}>
            {Object.entries(TEMPLATE_OPTIONS).map(([k,v]) => <option key={k} value={k}>{k} — {v.name}</option>)}
          </select>
          {tpl === "D" && (
            <>
              <select value={settings.copies} onChange={e => setSettings(s => ({ ...s, copies: e.target.value }))} style={{ padding:"6px 10px", borderRadius:8, border:"1.5px solid #e2ddd8" }}>
                <option value="dual">Dual Copy</option>
                <option value="single">Single Copy</option>
              </select>
              <select value={settings.paperSize} onChange={e => setSettings(s => ({ ...s, paperSize: e.target.value }))} style={{ padding:"6px 10px", borderRadius:8, border:"1.5px solid #e2ddd8" }}>
                <option value="A4">A4</option>
                <option value="Thermal80">Thermal 80mm</option>
              </select>
              <label style={{ display:"flex", alignItems:"center", gap:4, fontSize:12 }}>
                Font
                <input type="number" min={8} max={16} value={settings.fontSize} onChange={e => setSettings(s => ({ ...s, fontSize: Math.max(8, Math.min(16, Number(e.target.value) || 11)) }))} style={{ width:50, padding:"4px 6px" }} />
              </label>
            </>
          )}
          <div style={{ flex:1 }} />
          <button className="btn btn-sm" style={{ background: editing ? "#fde68a" : "#fff", border:"1.5px solid #d97706", color:"#92400e", fontWeight:700 }} onClick={() => setEditing(v => !v)}>✎ {editing ? "Done Editing" : "EDIT"}</button>
          <button className="btn btn-outline btn-sm" onClick={printNow}>🖨 Print</button>
          <button className="btn btn-dark btn-sm" onClick={onClose}>Close</button>
        </div>

        {editing && tpl === "D" && (
          <div className="ss-print-editor" style={{ border:"1px dashed #d97706", background:"#fffbeb", padding:14, borderRadius:10, marginBottom:14, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, fontSize:13 }}>
            <div style={{ gridColumn:"1 / -1", fontWeight:700, color:"#92400e" }}>Shop Header</div>
            <label>Shop name<input value={settings.shopName} onChange={e => setSettings(s => ({ ...s, shopName: e.target.value }))} /></label>
            <label>Tagline<input value={settings.tagline} onChange={e => setSettings(s => ({ ...s, tagline: e.target.value }))} /></label>
            <label style={{ gridColumn:"1 / -1" }}>Address<textarea rows={2} value={settings.address} onChange={e => setSettings(s => ({ ...s, address: e.target.value }))} /></label>
            <label>Phone<input value={settings.phone} onChange={e => setSettings(s => ({ ...s, phone: e.target.value }))} /></label>
            <label>GSTIN<input value={settings.gstin} onChange={e => setSettings(s => ({ ...s, gstin: e.target.value }))} /></label>
            <label style={{ gridColumn:"1 / -1" }}>Logo
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <img src={settings.logo} alt="" style={{ height:40, width:40, objectFit:"contain", border:"1px solid #e2ddd8", borderRadius:6 }} />
                <input type="file" accept="image/*" onChange={onLogoFile} />
                <button className="btn btn-sm" onClick={() => setSettings(s => ({ ...s, logo: BRAND_LOGO }))}>Reset</button>
              </div>
            </label>

            <div style={{ gridColumn:"1 / -1", fontWeight:700, color:"#92400e", marginTop:6 }}>Toggle Sections</div>
            <div style={{ gridColumn:"1 / -1", display:"flex", flexWrap:"wrap", gap:10 }}>
              {Object.keys(settings.sections).map(k => (
                <label key={k} style={{ display:"flex", alignItems:"center", gap:4, fontSize:12 }}>
                  <input type="checkbox" checked={settings.sections[k]} onChange={() => toggleSec(k)} />{k}
                </label>
              ))}
            </div>

            <div style={{ gridColumn:"1 / -1", fontWeight:700, color:"#92400e", marginTop:6, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span>Terms & Conditions</span>
              <button className="btn btn-sm" onClick={addTerm}>+ Add term</button>
            </div>
            <div style={{ gridColumn:"1 / -1", display:"grid", gap:6 }}>
              {settings.terms.map((t, i) => (
                <div key={i} style={{ display:"flex", gap:6 }}>
                  <span style={{ width:22, fontSize:12, paddingTop:6 }}>{i+1}.</span>
                  <input style={{ flex:1 }} value={t} onChange={e => updateTerm(i, e.target.value)} />
                  <button className="btn btn-sm btn-danger" onClick={() => removeTerm(i)}>✕</button>
                </div>
              ))}
            </div>

            <div style={{ gridColumn:"1 / -1", fontSize:11, color:"#92400e" }}>Changes auto-save to this device.</div>
          </div>
        )}

        <div className="ss-print-sheet" style={{ border:"1px solid #ece6dd", borderRadius:10, padding:tpl === "D" ? 12 : 18, background:"#fffdfa" }}>
          {tpl === "D" ? (
            <div style={{ width: paperWidth, maxWidth: "100%", margin: "0 auto", display: isDual ? "grid" : "block", gridTemplateColumns: isDual ? "1fr 1fr" : "1fr", gap: 6 }}>
              {isDual ? (
                <>
                  <ClinicalInvoiceCopy copyLabel="Store Copy" settings={settings} row={row} ctx={ctx} items={items} sub={sub} discount={discount} total={total} paid={paid} balance={balance} />
                  <ClinicalInvoiceCopy copyLabel="Customer Copy" settings={settings} row={row} ctx={ctx} items={items} sub={sub} discount={discount} total={total} paid={paid} balance={balance} />
                </>
              ) : (
                <ClinicalInvoiceCopy copyLabel="Customer Copy" settings={settings} row={row} ctx={ctx} items={items} sub={sub} discount={discount} total={total} paid={paid} balance={balance} />
              )}
            </div>
          ) : (
            <>
              <MarkdownInvoice md={fillTemplate(INVOICE_TEMPLATES[tpl].md, legacyData)} />
              {discount > 0 && <div style={{ fontSize:12, color:"#9b8e82", marginTop:6 }}>Discount: {currency(discount)}</div>}
              {balance > 0 && <div style={{ marginTop:8, fontWeight:700, color:"#b91c1c" }}>Balance Due: {currency(balance)}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const SECTIONS = ["patients","patientBill","optometrist","opticals","inventory","invoices","alerts"];
const SECTION_LABELS = { patients:"OP Registration", patientBill:"K Sheet Entry", optometrist:"Optometrist", opticals:"Opticals", inventory:"Inventory", purchaseOrders:"Purchase Orders", invoices:"Sales & Invoices", alerts:"Low Stock Alerts" };
const LENS_TYPES     = ["Single Vision","Bifocal","Progressive","Anti-Reflective","Photochromic","Blue Cut","UV400","Polarized","High Index 1.60","High Index 1.67","High Index 1.74","Trivex","Polycarbonate","Toric (Contact)","Multifocal (Contact)"];
const DELIVERY_STATUS= ["Delivered","Not Ready","Fixing Completed But Not Delivered"];
const DESIGNATIONS   = ["FRONT DESK STAFF", "OPTOM", "OPTOMOLOGIST", "MD", "COUNSELLING ROOM", "DEVELOPER"];
// Privileged designations: equal to MD/Owner access (Counselling Room excludes Manage Staff + Audit Log)
const hasMDAccess   = (s) => !!s && (s.role === "owner" || s.designation === "MD" || s.designation === "COUNSELLING ROOM");
const hasOwnerOrMD  = (s) => !!s && (s.role === "owner" || s.designation === "MD");
const isCounselling = (s) => !!s && s.designation === "COUNSELLING ROOM";

const CS = { background: "#f0ede8", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 12 };

const GCSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@500;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#c8bfb0;border-radius:3px}
input,select,textarea,button{font-family:inherit}button{cursor:pointer}
.nav-item{display:flex;align-items:center;gap:9px;padding:8px 13px;border-radius:9px;font-size:13px;font-weight:500;color:#6b5e52;border:none;background:none;width:100%;text-align:left;transition:all .18s}
.nav-item:hover{background:#e8e2db;color:#1a1714}.nav-item.active{background:#1a1714;color:#f0ede8}
.badge{background:#e55e3a;color:#fff;border-radius:20px;font-size:11px;padding:1px 7px;font-weight:600}
.card{background:#fff;border-radius:16px;padding:22px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.btn{padding:9px 18px;border-radius:9px;font-size:13px;font-weight:600;border:none;transition:all .15s}
.btn-dark{background:#1a1714;color:#f0ede8}.btn-dark:hover{background:#2e2820}.btn-dark:disabled{opacity:.5;cursor:not-allowed}
.btn-outline{background:transparent;border:1.5px solid #c8bfb0;color:#1a1714}.btn-outline:hover{background:#f0ede8}.btn-outline:disabled{opacity:.5}
.btn-danger{background:#fee2e2;color:#dc2626}.btn-danger:hover{background:#fecaca}
.btn-sm{padding:6px 12px;font-size:12px;border-radius:7px}
input[type=text],input[type=number],input[type=date],input[type=time],input[type=email],input[type=tel],input[type=password],select,textarea{width:100%;padding:8px 11px;border:1.5px solid #e2ddd8;border-radius:8px;font-size:13px;background:#faf9f7;transition:border .15s;outline:none}
input:focus,select:focus,textarea:focus{border-color:#1a1714;background:#fff}
input[readonly]{background:#f0ede8;color:#9b8e82;border-color:#e2ddd8}
label{font-size:11px;font-weight:700;color:#6b5e52;text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:4px}
table{width:100%;border-collapse:collapse;font-size:12.5px}
th{text-align:left;padding:9px 12px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#9b8e82;border-bottom:1.5px solid #e8e2db;white-space:nowrap}
td{padding:10px 12px;border-bottom:1px solid #f0ede8;vertical-align:middle}
tr:last-child td{border-bottom:none}tr:hover td{background:#faf9f7}
.tag{display:inline-block;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600}
.tag-green{background:#dcfce7;color:#16a34a}.tag-yellow{background:#fef9c3;color:#a16207}
.tag-red{background:#fee2e2;color:#dc2626}.tag-blue{background:#dbeafe;color:#1d4ed8}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:100;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
.modal{background:#fff;border-radius:20px;padding:28px;max-height:93vh;overflow-y:auto;box-shadow:0 24px 70px rgba(0,0,0,.25)}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.form-grid .full{grid-column:1/-1}
.stat-card{background:#fff;border-radius:14px;padding:20px 22px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.stat-num{font-family:'Playfair Display',serif;font-size:34px;font-weight:700;line-height:1}
.section-title{font-family:'Playfair Display',serif;font-size:21px;font-weight:700;margin-bottom:18px}
p{line-height:1.7}
@media(max-width:768px){.form-grid{grid-template-columns:1fr}}
`;

const DEFAULT_ACCOUNTS = [
  { id:"owner",      name:"Owner",       role:"owner", designation: "MD", branch:"All",        password:"owner123", perms:{} },
  { id:"staff_kkd1", name:"Ravi (KKD)",  role:"staff", designation: "FRONT DESK STAFF", branch:"KKD_Main Branch", password:"kkd1234",
    perms:{ patients:{view:true,add:true,edit:false}, patientBill:{view:true,add:true,edit:false}, optometrist:{view:true,add:true,edit:false}, opticals:{view:true,add:true,edit:false}, inventory:{view:true,add:false,edit:false}, invoices:{view:true,add:false,edit:false}, alerts:{view:true,add:false,edit:false} }
  },
];

const DEFAULT_FIELD_VISIBILITY = {
  patients:     ["timestamp","date","time","mrNo","patientId","name","phone","address","gender","age","designation","aadharNo","ref","paymentAmount","paymentMode","paymentRefNo","branch","remarks","visitType"],
  patientBill:  ["timestamp","date","time","mrNo","patientId","name","phone","address","gender","age","complaint","pastHistory"],
  optometrist:  ["timestamp","mrNo","patientId","name","complaint","pastHistory"],
  opticals:     ["timestamp","billNo","mrNo","patientId","name","phone","address","totalPrice","discount","advance","advancePaymentMethod","transactionId","balance","deliveryStatus","optomName"],
  inventory:    ["sku","name","category","brand","qty","reorder","lensPower","lensType","boxNo","price","location"],
  invoices:     ["id","date","patientName","items","discount","status"],
};

let _sb = null;
function initSB(url, key) {
  if (!url || !key) { _sb = null; return false; }
  _sb = { url: url.replace(/\/$/, ""), key };
  return true;
}
function sbReady() { return _sb !== null; }

// ---- Realtime (live updates across devices) ----
// Uses a WebSocket connection so changes made on one device appear on others
// in ~1 second, instead of waiting for the periodic poll. Browser-only.
let _sbRealtimeClient = null;
let _sbRealtimeChannel = null;
let _sbRealtimeKey = "";
async function startRealtime(url, key, onChange) {
  if (typeof window === "undefined" || !url || !key) return;
  const sig = `${url}::${key}`;
  if (_sbRealtimeKey === sig && _sbRealtimeChannel) return; // already connected
  stopRealtime();
  try {
    // Loaded from a CDN at runtime (not bundled) so the build doesn't require
    // "@supabase/supabase-js" to be installed as an npm dependency.
    const { createClient } = await import(/* @vite-ignore */ "https://esm.sh/@supabase/supabase-js@2");
    _sbRealtimeClient = createClient(url.replace(/\/$/, ""), key, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
    _sbRealtimeKey = sig;
    const ch = _sbRealtimeClient.channel("opti-live");
    // Listen to every change on every table in the public schema.
    ch.on("postgres_changes", { event: "*", schema: "public" }, () => {
      try { onChange && onChange(); } catch {}
    });
    ch.subscribe();
    _sbRealtimeChannel = ch;
  } catch (e) { /* realtime is best-effort; polling remains as fallback */ }
}
function stopRealtime() {
  try { if (_sbRealtimeChannel && _sbRealtimeClient) _sbRealtimeClient.removeChannel(_sbRealtimeChannel); } catch {}
  _sbRealtimeChannel = null;
  _sbRealtimeKey = "";
}

const SB_TABLES = {
  patients: "patients", patientBill: "patientBill", optometrist: "optometrist", opticals: "opticals",
  stock: "stock", invoices: "invoices", accounts: "accounts", audit_log: "audit_log", tasks: "tasks", reminders: "reminders",
  counselling: "counselling",
};
// Tables that exist only on this device (no cloud table provisioned).
const LOCAL_ONLY_TABLES = new Set(["purchaseOrders", "lensSale"]);

const K_SHEET_PACK_PREFIX = "\n\n__K_SHEET_FULL__:";
const K_SHEET_DIRECT_FIELDS = new Set(["id","timestamp","date","time","mrNo","patientId","name","phone","address","gender","age","complaint","pastHistory","branch","status","createdBy","createdByName","createdAt"]);
const K_SHEET_INTERNAL_FIELDS = new Set(["_lookup"]);

function unpackKSheetRow(row) {
  const text = typeof row?.pastHistory === "string" ? row.pastHistory : "";
  const idx = text.indexOf(K_SHEET_PACK_PREFIX);
  if (idx < 0) return row;
  try {
    const extra = JSON.parse(decodeURIComponent(text.slice(idx + K_SHEET_PACK_PREFIX.length).trim()));
    return { ...row, ...extra, pastHistory: text.slice(0, idx).trimEnd() };
  } catch { return row; }
}

function packKSheetForLegacyTable(row) {
  const packed = {};
  K_SHEET_DIRECT_FIELDS.forEach(k => { if (row[k] !== undefined) packed[k] = row[k]; });
  const extra = {};
  Object.entries(row || {}).forEach(([k, v]) => {
    if (!K_SHEET_DIRECT_FIELDS.has(k) && !K_SHEET_INTERNAL_FIELDS.has(k) && v !== undefined && v !== null && v !== "") extra[k] = v;
  });
  if (Object.keys(extra).length) {
    const cleanPastHistory = String(row.pastHistory || "").split(K_SHEET_PACK_PREFIX)[0].trimEnd();
    packed.pastHistory = `${cleanPastHistory}${K_SHEET_PACK_PREFIX}${encodeURIComponent(JSON.stringify(extra))}`;
  }
  return packed;
}

const missingColumnFromError = (txt) => String(txt || "").match(/'([^']+)' column/)?.[1] || null;

// Numeric columns in the cloud DB. Empty strings must become null, otherwise
// Postgres rejects them with: invalid input syntax for type numeric: ""
const NUMERIC_FIELDS = new Set([
  "age", "paymentAmount", "amount", "totalPrice", "advance", "balance",
  "price", "quantity", "qty", "rate", "total", "subtotal", "discount",
  "tax", "gst", "stock", "minStock", "cost", "mrp",
]);
function sanitizeNumericRow(row) {
  if (!row || typeof row !== "object") return row;
  const out = { ...row };
  for (const k of Object.keys(out)) {
    if (NUMERIC_FIELDS.has(k)) {
      const v = out[k];
      if (v === "" || v === undefined || v === null) { out[k] = null; continue; }
      const n = typeof v === "number" ? v : Number(String(v).replace(/[^0-9.+-]/g, ""));
      out[k] = Number.isFinite(n) ? n : null;
    }
  }
  return out;
}

function sbHeaders() { return { "Content-Type": "application/json", "apikey": _sb.key, "Authorization": `Bearer ${_sb.key}` }; }

async function sbPostPayload(table, payload, prefer) {
  const r = await fetch(`${_sb.url}/rest/v1/${encodeURIComponent(SB_TABLES[table] || table)}`, {
    method: "POST", headers: { ...sbHeaders(), "Prefer": prefer }, body: JSON.stringify(payload),
  });
  if (r.ok) return { ok: true, error: null };
  const errBody = await r.text().catch(() => "");
  return { ok: false, error: `HTTP ${r.status}: ${errBody.slice(0, 300)}`, raw: errBody };
}

async function sbPostPayloadPruned(table, payload, prefer) {
  let nextPayload = payload;
  const removed = new Set();
  for (let i = 0; i < 20; i += 1) {
    const result = await sbPostPayload(table, nextPayload, prefer);
    if (result.ok) return { ...result, removedColumns: Array.from(removed) };
    const col = missingColumnFromError(result.raw);
    if (!col || removed.has(col)) return { ...result, removedColumns: Array.from(removed) };
    removed.add(col);
    const prune = row => { const copy = { ...(row || {}) }; delete copy[col]; return copy; };
    nextPayload = Array.isArray(nextPayload) ? nextPayload.map(prune) : prune(nextPayload);
  }
  return { ok: false, error: "Too many missing database columns.", removedColumns: Array.from(removed) };
}

async function sbGet(table) {
  if (!_sb) return null;
  try {
    const tbl = encodeURIComponent(SB_TABLES[table] || table);
    const PAGE = 1000;
    let offset = 0;
    let acc = [];
    // PostgREST caps each response at 1000 rows — page through with Range headers.
    for (let i = 0; i < 1000; i += 1) {
      const r = await fetch(`${_sb.url}/rest/v1/${tbl}?select=*`, {
        headers: { ...sbHeaders(), "Range-Unit": "items", "Range": `${offset}-${offset + PAGE - 1}` },
      });
      if (!r.ok) { if (offset === 0) return null; break; }
      const d = await r.json();
      if (!Array.isArray(d)) { if (offset === 0) return null; break; }
      acc = acc.concat(d);
      if (d.length < PAGE) break;
      offset += PAGE;
    }
    return table === "patientBill" ? acc.map(unpackKSheetRow) : acc;
  } catch(e) { return null; }
}

async function sbUpsertOne(table, row) {
  if (!_sb) return { ok: false, error: "Not connected" };
  if (LOCAL_ONLY_TABLES.has(table)) return { ok: true, error: null, skipped: true };
  try {
    const payload = table === "patientBill" ? packKSheetForLegacyTable(row) : sanitizeNumericRow(row);
    let result = await sbPostPayload(table, payload, "resolution=merge-duplicates,return=minimal");
    if (!result.ok) result = await sbPostPayloadPruned(table, payload, "resolution=merge-duplicates,return=minimal");
    if (!result.ok) console.error(`sbUpsertOne [${table}]:`, result.error);
    return result;
  } catch(e) { return { ok: false, error: String(e) }; }
}

function normalizeRowKeys(rows) {
  // PostgREST PGRST102 "All object keys must match" — every row in a bulk
  // upsert must have the exact same set of keys. Union all keys and fill
  // missing ones with null.
  const keySet = new Set();
  for (const r of rows) if (r && typeof r === "object") for (const k of Object.keys(r)) keySet.add(k);
  const keys = Array.from(keySet);
  return rows.map(r => {
    const out = {};
    for (const k of keys) out[k] = (r && k in r) ? r[k] : null;
    return out;
  });
}

async function sbUpsertMany(table, rows) {
  if (!_sb) return { ok: false, error: "Not connected" };
  if (LOCAL_ONLY_TABLES.has(table)) return { ok: true, error: null, skipped: true };
  if (!rows.length) return { ok: true, error: null };
  try {
    const packed = table === "patientBill" ? rows.map(packKSheetForLegacyTable) : rows.map(sanitizeNumericRow);
    const payload = normalizeRowKeys(packed);
    let result = await sbPostPayload(table, payload, "resolution=merge-duplicates,return=minimal");
    if (!result.ok) result = await sbPostPayloadPruned(table, payload, "resolution=merge-duplicates,return=minimal");
    if (!result.ok) console.warn(`sbUpsertMany ${table}:`, result.error);
    return result;
  } catch(e) { return { ok: false, error: String(e) }; }
}

async function sbDelete(table, id) {
  if (!_sb) return false;
  if (LOCAL_ONLY_TABLES.has(table)) return true;
  try {
    const r = await fetch(`${_sb.url}/rest/v1/${encodeURIComponent(SB_TABLES[table] || table)}?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: sbHeaders() });
    return r.ok;
  } catch(e) { return false; }
}

async function sbInsert(table, row) {
  if (!_sb) return false;
  if (LOCAL_ONLY_TABLES.has(table)) return true;
  try {
    const r = await fetch(`${_sb.url}/rest/v1/${encodeURIComponent(SB_TABLES[table] || table)}`, {
      method: "POST", headers: { ...sbHeaders(), "Prefer": "return=minimal" }, body: JSON.stringify(row),
    });
    return r.ok;
  } catch { return false; }
}

const now      = () => new Date();
const ts       = (d = now()) => `${d.toLocaleDateString("en-IN")} ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
const todayStr = () => now().toISOString().split("T")[0];
const timeStr  = () => now().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
const currency = (n) => `₹${Number(n || 0).toFixed(2)}`;
const uid      = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// HTML date inputs only display yyyy-mm-dd. Imported CSV/view data can be dd-mm-yyyy.
const toISODate = (value) => {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().split("T")[0];
  const raw = String(value).trim();
  const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${String(iso[2]).padStart(2, "0")}-${String(iso[3]).padStart(2, "0")}`;
  const dmy = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmy) return `${dmy[3]}-${String(dmy[2]).padStart(2, "0")}-${String(dmy[1]).padStart(2, "0")}`;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().split("T")[0];
};

function exportCSV(rows, filename) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv  = [keys.join(","), ...rows.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: filename }).click();
}

function downloadCSVTemplate(headers, filename) {
  const csv = headers.join(",") + "\n";
  Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: filename }).click();
}

// Robust-ish CSV parser supporting quoted fields, escaped quotes, and CRLF.
function parseCSV(text) {
  const rows = [];
  let cur = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { cur.push(field); field = ""; }
      else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).filter(r => r.some(v => String(v).trim() !== "")).map(r => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (r[i] ?? "").trim(); });
    return obj;
  });
}

function importCSVFile(onRows) {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = ".csv,text/csv";
  inp.onchange = () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { onRows(parseCSV(String(reader.result || ""))); }
      catch (e) { alert("Failed to parse CSV: " + (e && e.message ? e.message : e)); }
    };
    reader.readAsText(f);
  };
  inp.click();
}

// ── Shared filter + sort helpers ──────────────────────────────────────────
const DATE_SORT_KEYS = new Set(["timestamp", "date", "createdAt", "reminderDate", "completedAt", "updatedAt", "deliveryDate"]);
function rowTime(v) {
  if (!v) return 0;
  const s = String(v).trim();
  // dd/mm/yyyy or dd-mm-yyyy or dd.mm.yyyy (optional time). ISO yyyy-mm-dd falls through to Date.parse.
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})(?:[ ,T]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?/i);
  if (m) {
    let h = Number(m[4] || 0); const ap = (m[7] || "").toLowerCase();
    if (ap === "pm" && h < 12) h += 12; if (ap === "am" && h === 12) h = 0;
    const yr = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return new Date(yr, Number(m[2]) - 1, Number(m[1]), h, Number(m[5] || 0), Number(m[6] || 0)).getTime();
  }
  const t = Date.parse(s);
  return isNaN(t) ? 0 : t;
}
// Returns true ONLY when the `date` column value equals today (compares date part, ignores time).
// Accepts ISO "yyyy-mm-dd", ISO datetime, "dd/mm/yyyy", "dd-mm-yyyy", and locale timestamps with date prefix.
function isTodayDate(d) {
  if (!d) return false;
  const today = now().toISOString().split("T")[0];
  const s = String(d).trim();
  // ISO date "2026-06-22" or ISO datetime "2026-06-22T08:46:39"
  if (s.startsWith(today)) return true;
  try {
    // Take the leading date token (before comma/space/T)
    const datePart = s.split(/[,\sT]/)[0];
    // dd/mm/yyyy or dd-mm-yyyy
    const parts = datePart.split(/[\/\-]/).filter(Boolean);
    if (parts.length === 3) {
      // If first token is 4 digits, treat as yyyy-mm-dd already
      if (parts[0].length === 4) {
        const [yyyy, mm, dd] = parts;
        const iso = `${yyyy.padStart(4,"0")}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
        if (iso === today) return true;
      } else {
        const [dd, mm, yyyy] = parts;
        const iso = `${yyyy.padStart(4, "0")}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
        if (iso === today) return true;
      }
    }
  } catch {}
  return false;
}
// Visit label for the Nth chronological visit of a patient.
function visitOrdinalLabel(n) {
  if (n <= 1) return "New Patient";
  const suffix = n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;
  return `${suffix} Visit`;
}
// De-duplicate OP registrations and assign visit numbers.
// • Same person = same (name + phone). Records with both blank stay separate.
// • Exact duplicate (same person + same MR No + same Date) → kept once.
// • Remaining records ordered by date; 1st = New Patient, 2nd/3rd/… Visit.
// • Any record with camp data (visitType "Camp" or a Ref/Camp value) → "Camp".
function dedupePatientVisits(rows) {
  const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
  const groups = new Map();
  for (const r of safeArray(rows)) {
    const nm = norm(r.name), ph = norm(r.phone);
    const key = (nm || ph) ? `${nm}|${ph}` : `__${r.id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  const out = [];
  for (const recs of groups.values()) {
    const seen = new Map();
    for (const r of recs) {
      const ek = `${norm(r.mrNo)}|${String(r.date || "").trim()}`;
      if (!seen.has(ek)) seen.set(ek, r);
    }
    const uniq = [...seen.values()].sort(
      (a, b) => (rowTime(a.date) || rowTime(a.timestamp)) - (rowTime(b.date) || rowTime(b.timestamp))
    );
    uniq.forEach((r, i) => {
      const camp = norm(r.visitType) === "camp" || String(r.ref || "").trim() !== "";
      const visitType = camp ? "Camp" : visitOrdinalLabel(i + 1);
      out.push({ ...r, visitType, visitCount: i + 1 });
    });
  }
  return out;
}
function sortRows(rows, key, dir) {
  if (!key) return rows;
  const mul = dir === "asc" ? 1 : -1;
  const isDate = DATE_SORT_KEYS.has(key);
  const isNum = NUMERIC_FIELDS.has(key);
  return [...rows].sort((a, b) => {
    const av = a?.[key], bv = b?.[key];
    if (isDate) return (rowTime(av) - rowTime(bv)) * mul;
    if (isNum) return ((parseFloat(av) || 0) - (parseFloat(bv) || 0)) * mul;
    return String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true, sensitivity: "base" }) * mul;
  });
}
function matchSearch(row, search, fields, filterField) {
  if (!search) return true;
  const q = search.toLowerCase();
  const keys = filterField ? [filterField] : fields.map(f => f.key);
  return keys.some(k => String(row?.[k] ?? "").toLowerCase().includes(q));
}
// Returns true when the row's date (falls back to timestamp) is within [from, to].
// `from` / `to` are ISO yyyy-mm-dd strings from date inputs; blank = unbounded.
function inDateRange(row, from, to, key = "date") {
  if (!from && !to) return true;
  const t = rowTime(row?.[key]) || rowTime(row?.timestamp);
  if (!t) return false;
  if (from) { const f = new Date(from + "T00:00:00").getTime(); if (!isNaN(f) && t < f) return false; }
  if (to)   { const e = new Date(to   + "T23:59:59").getTime(); if (!isNaN(e) && t > e) return false; }
  return true;
}
const _fsSelStyle = { borderRadius: 10, border: "1px solid #e8e2db", padding: "8px 10px", fontSize: 13, background: "#fff" };
const _fsDateStyle = { borderRadius: 10, border: "1px solid #e8e2db", padding: "7px 9px", fontSize: 13, background: "#fff", color: "#6b5e52" };
function FilterSortBar({ search, setSearch, placeholder, fields, filterField, setFilterField, sortKey, setSortKey, sortDir, setSortDir, dateFrom, setDateFrom, dateTo, setDateTo, dateKey, children }) {
  const hasDateRange = typeof setDateFrom === "function" && typeof setDateTo === "function";
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
      <input type="text" placeholder={placeholder} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: "1 1 240px", minWidth: 200, maxWidth: 380, borderRadius: 10, border: "1px solid #e8e2db", padding: "8px 14px", fontSize: 13 }} />
      <select value={filterField} onChange={e => setFilterField(e.target.value)} style={_fsSelStyle} title="Filter by a specific field">
        <option value="">🔎 All fields</option>
        {fields.map(f => <option key={f.key} value={f.key}>In: {f.label}</option>)}
      </select>
      <select value={sortKey} onChange={e => setSortKey(e.target.value)} style={_fsSelStyle} title="Sort by">
        {fields.map(f => <option key={f.key} value={f.key}>Sort: {f.label}</option>)}
      </select>
      <button className="btn btn-outline btn-sm" onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")} title="Toggle ascending / descending">{sortDir === "asc" ? "↑ Asc" : "↓ Desc"}</button>
      {hasDateRange && (
        <span style={{ display: "inline-flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#9b8e82" }}>📅 From</span>
          <input type="date" value={dateFrom || ""} onChange={e => setDateFrom(e.target.value)} style={_fsDateStyle} title="Start date" />
          <span style={{ fontSize: 12, color: "#9b8e82" }}>To</span>
          <input type="date" value={dateTo || ""} onChange={e => setDateTo(e.target.value)} style={_fsDateStyle} title="End date" />
          {(dateFrom || dateTo) && <button className="btn btn-outline btn-sm" onClick={() => { setDateFrom(""); setDateTo(""); }} title="Clear date range">✕ Clear</button>}
        </span>
      )}
      {children}
    </div>
  );
}

const validate = {
  phone:     v => { const s = String(v || "").trim(); return s.length === 10 && s[0] !== "0" && /^\d+$/.test(s); },
  town:      v => { const s = String(v || "").trim(); return s.length > 0 && !/\d/.test(s); },
  sphereCyl: v => { const n = parseFloat(v); return !isNaN(n) && n >= -6 && n <= 6 && Math.round(Math.abs(n) * 100) % 25 === 0; },
  axis:      v => { const n = parseFloat(v); return !isNaN(n) && n >= 0 && n <= 180 && n === Math.round(n); },
  add:       v => { const n = parseFloat(v); if (isNaN(n)) return false; if (n === 0) return true; return n >= 0.75 && n <= 3.00 && Math.round(n * 100) % 25 === 0; },
};

const vStyle = (val, fn, touched) => !touched ? {} : fn(val) ? { borderColor: "#16a34a" } : { borderColor: "#dc2626" };
const vMsg   = (val, fn, touched, msg) => (!touched || fn(val)) ? null : <div style={{ fontSize: 11, color: "#dc2626", marginTop: 3 }}>{msg}</div>;

const LS = {
  get:  (k, def) => { try { const val = JSON.parse(localStorage.getItem(k)); return val !== null ? val : def; } catch { return def; } },
  set:  (k, v)   => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  sess: (v)      => { try { if (v) sessionStorage.setItem("opti_sess", JSON.stringify(v)); else sessionStorage.removeItem("opti_sess"); } catch {} },
  getSess: ()    => { try { return JSON.parse(sessionStorage.getItem("opti_sess")); } catch { return null; } },
};

const SEED_DATA = { patients: [], patientBill: [], optometrist: [], opticals: [], lensSale: [], stock: [], purchaseOrders: [], invoices: [], tasks: [], reminders: [], counselling: [] };
const safeArray = (arr, fallback = []) => Array.isArray(arr) ? arr : fallback;

// ── Dashboard CMS defaults (editable in DashboardCMS view) ──────────────
const DEFAULT_DASH_CMS = {
  blocks: {
    opReg:   { title: "OP Registration (Today)", sub: "New patients today",     bg: "linear-gradient(135deg,#fef3c7,#fde68a)", color: "#92400e", icon: "◉",  enabled: true, order: 1, link: "patients"    },
    revisit: { title: "Revisit / Review / Camp", sub: "Returning today",        bg: "linear-gradient(135deg,#dbeafe,#bfdbfe)", color: "#1e3a8a", icon: "↻",  enabled: true, order: 2, link: "patients"    },
    ksheet:  { title: "K Sheets (Today)",        sub: "K Sheet entries today",  bg: "linear-gradient(135deg,#dcfce7,#bbf7d0)", color: "#14532d", icon: "📋", enabled: true, order: 3, link: "patientBill" },
    revenue: { title: "Revenue (Today)",         sub: "Paid invoices today",    bg: "linear-gradient(135deg,#fce7f3,#fbcfe8)", color: "#9d174d", icon: "₹",  enabled: true, order: 4, link: "invoices"    },
  },
  panels: {
    tasks:          { title: "📌 Today's Tasks",          accent: "#d97706", enabled: true, order: 1 },
    reminders:      { title: "🔔 Today's Reminders",      accent: "#1d4ed8", enabled: true, order: 2 },
    advice:         { title: "💊 K Sheet Advice (Today)", accent: "#7c3aed", enabled: true, order: 3, ownerOnly: true },
    branchOverview: { title: "🏥 Branch Overview (Today)",accent: "#16a34a", enabled: true, order: 4, ownerOnly: true },
    activity:       { title: "⚡ Today's Activity",       accent: "#9d174d", enabled: true, order: 5, ownerOnly: true },
  },
};

// ── Patient status (computed from cross-section lookup) ─────────────────
const PATIENT_STATUS = {
  OUT:          { key: "OUT",          label: "Patient Out",          bg: "#e5e7eb", color: "#374151" },
  OPTICALS:     { key: "OPTICALS",     label: "At Opticals",          bg: "#fce7f3", color: "#9d174d" },
  OPTOMOLOGIST: { key: "OPTOMOLOGIST", label: "With Optomologist",    bg: "#ede9fe", color: "#5b21b6" },
  OPTOM:        { key: "OPTOM",        label: "With Optom",           bg: "#dbeafe", color: "#1e3a8a" },
  OP_REG:       { key: "OP_REG",       label: "OP Registered",        bg: "#fef3c7", color: "#92400e" },
  NONE:         { key: "NONE",         label: "Not Registered",       bg: "#f0ede8", color: "#6b5e52" },
};

function getPatientStatus(p, data) {
  if (!p) return PATIENT_STATUS.NONE;
  const mr  = String(p.mrNo || "").toLowerCase();
  const pid = String(p.patientId || "").toLowerCase();
  const nm  = String(p.name || "").toLowerCase();
  const match = (r) => (mr && String(r.mrNo || "").toLowerCase() === mr) || (pid && String(r.patientId || "").toLowerCase() === pid);
  const inv = safeArray(data.invoices).find(i => i.status === "Paid" && (String(i.patientName || "").toLowerCase() === nm || match(i)));
  if (inv) return PATIENT_STATUS.OUT;
  const optl = safeArray(data.opticals).find(match);
  if (optl) return PATIENT_STATUS.OPTICALS;
  const ks = safeArray(data.patientBill).find(match);
  if (ks) {
    if (ks.ophthalmologist || ks.advice || ks.fundus || ks.iris || ks.lens) return PATIENT_STATUS.OPTOMOLOGIST;
    return PATIENT_STATUS.OPTOM;
  }
  if (safeArray(data.patients).find(match)) return PATIENT_STATUS.OP_REG;
  return PATIENT_STATUS.NONE;
}

// ── Reminder due date+time helpers ──
function reminderDue(r) {
  if (!r || !r.reminderDate) return null;
  const t = r.reminderTime && /^\d{1,2}:\d{2}/.test(r.reminderTime) ? r.reminderTime : "23:59";
  const d = new Date(`${r.reminderDate}T${t.length === 4 ? "0" + t : t}`);
  return isNaN(d.getTime()) ? null : d;
}
function reminderOverdue(r) {
  if (!r || r.status === "done") return false;
  const due = reminderDue(r);
  return !!due && due < new Date();
}

// ── Task / Reminder color rule: done=green, pending+not overdue=yellow, overdue=red ──
function deadlineColor(item, dateField = "deadline") {
  if (!item) return { bg: "#fef9c3", color: "#a16207", border: "#eab308", label: "Pending" };
  if (item.status === "done") return { bg: "#dcfce7", color: "#14532d", border: "#16a34a", label: "Completed" };
  const dl = item[dateField];
  if (dl) {
    if (dateField === "reminderDate") {
      if (reminderOverdue(item)) return { bg: "#fee2e2", color: "#7f1d1d", border: "#dc2626", label: "Overdue" };
    } else {
      const dlDate = new Date(dl);
      if (!isNaN(dlDate.getTime()) && dlDate < new Date(todayStr())) return { bg: "#fee2e2", color: "#7f1d1d", border: "#dc2626", label: "Overdue" };
    }
  }
  return { bg: "#fef9c3", color: "#854d0e", border: "#eab308", label: "Pending" };
}

// Floating overdue-reminder alert — visible to every designation. Shows reminders
// whose deadline (date + time) has passed, re-checking every 30s.
function ReminderAlerts({ session, data, setView }) {
  const [, setTick] = useState(0);
  const [dismissed, setDismissed] = useState([]);
  const [open, setOpen] = useState(true);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(id); }, []);
  if (!session) return null;
  const isOwner = session.role === "owner";
  const branch = session.branch;
  const all = safeArray(data.reminders).filter(r => isOwner || r.branch === branch);
  const overdue = all.filter(r =>
    reminderOverdue(r) &&
    !dismissed.includes(r.id) &&
    (!r.targetDesignation || hasMDAccess(session) || session.designation === r.targetDesignation)
  ).sort((a, b) => (reminderDue(a)?.getTime() || 0) - (reminderDue(b)?.getTime() || 0));
  if (!overdue.length) return null;
  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        style={{ position:"fixed", right:18, bottom:18, zIndex:9999, background:"#dc2626", color:"#fff", border:"none", borderRadius:30, padding:"10px 16px", fontWeight:800, fontSize:13, cursor:"pointer", boxShadow:"0 6px 20px rgba(220,38,38,.4)" }}>
        ⏰ {overdue.length} Overdue
      </button>
    );
  }
  return (
    <div style={{ position:"fixed", right:18, bottom:18, zIndex:9999, width:340, maxWidth:"90vw" }}>
      <div style={{ background:"#fff", border:"2px solid #dc2626", borderRadius:14, boxShadow:"0 10px 34px rgba(0,0,0,.20)", overflow:"hidden" }}>
        <div style={{ background:"#dc2626", color:"#fff", padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontWeight:800, fontSize:13 }}>⏰ {overdue.length} Overdue Reminder{overdue.length > 1 ? "s" : ""}</div>
          <button onClick={() => setOpen(false)} style={{ background:"transparent", border:"none", color:"#fff", cursor:"pointer", fontSize:16, lineHeight:1 }}>✕</button>
        </div>
        <div style={{ maxHeight:320, overflowY:"auto" }}>
          {overdue.slice(0, 10).map(r => (
            <div key={r.id} onClick={() => setView("reminders")} style={{ padding:"10px 14px", borderBottom:"1px solid #f0ede8", cursor:"pointer" }}>
              <div style={{ fontWeight:700, fontSize:13, color:"#7f1d1d" }}>{r.name} <span style={{ fontWeight:400, fontSize:11, color:"#9b8e82" }}>({r.reminderType})</span></div>
              <div style={{ fontSize:11, color:"#dc2626", fontWeight:700 }}>Due {r.reminderDate}{r.reminderTime ? ` · ${r.reminderTime}` : ""} · {r.phone || "—"}</div>
              {r.targetDesignation && <div style={{ fontSize:10, color:"#9b8e82" }}>For: {r.targetDesignation}</div>}
              {r.notes && <div style={{ fontSize:11, color:"#9b8e82", marginTop:2 }}>{r.notes}</div>}
              <button onClick={(e) => { e.stopPropagation(); setDismissed(d => [...d, r.id]); }}
                style={{ marginTop:4, fontSize:10, background:"transparent", border:"none", color:"#9b8e82", cursor:"pointer", textDecoration:"underline" }}>Dismiss</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



export default function App() {
  const [session,  setSession]  = useState(() => LS.getSess());
  const [accounts, setAccounts] = useState(() => safeArray(LS.get("opti_accounts", DEFAULT_ACCOUNTS), DEFAULT_ACCOUNTS));
  const accountsWriteInFlight = useRef(false);
  // Per-table in-flight write counter — pauses cloud→local overwrites for that table.
  const writesInFlight = useRef({});
  const [data,     setData]     = useState(() => { const d = LS.get("opti_data_v4", SEED_DATA); return d && typeof d === 'object' ? d : SEED_DATA; });
  const [auditLog, setAuditLog] = useState(() => safeArray(LS.get("opti_audit", [])));
  const [fieldVis, setFieldVis] = useState(() => LS.get("opti_fields", DEFAULT_FIELD_VISIBILITY) || DEFAULT_FIELD_VISIBILITY);
  const [dashCms,  setDashCms]  = useState(() => {
    const v = LS.get("opti_dash_cms", DEFAULT_DASH_CMS);
    return v && v.blocks && v.panels ? v : DEFAULT_DASH_CMS;
  });
  const [sbCreds,  setSbCreds]  = useState(() => LS.get("opti_sb", { url: "", key: "" }));
  
  const [sbStatus, setSbStatus] = useState("idle");
  const [view,     setView]     = useState("dashboard");
  const [navToday, setNavToday] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncing,  setSyncing]  = useState(false);

  // Navigate from a dashboard card to a section, optionally highlighting today's rows.
  const navTo = useCallback((v, today = false) => { setNavToday(!!today); setView(v); }, []);
  // Sidebar / manual navigation always clears the today highlight.
  const setViewNav = useCallback((v) => { setNavToday(false); setView(v); }, []);

  useEffect(() => { LS.set("opti_accounts", accounts); }, [accounts]);
  useEffect(() => { LS.set("opti_data_v4",  data);     }, [data]);
  useEffect(() => { LS.set("opti_audit",    auditLog); }, [auditLog]);
  useEffect(() => { LS.set("opti_fields",   fieldVis); }, [fieldVis]);
  useEffect(() => { LS.set("opti_dash_cms", dashCms);  }, [dashCms]);
  useEffect(() => { LS.set("opti_sb",       sbCreds);  }, [sbCreds]);

  const syncFromCloud = async (url, key) => {
    if (!url || !key) return;
    initSB(url, key);
    if (!sbReady() || syncing) return;
    setSyncing(true);
    try {
      const [pts, bills, optom, optcl, stk, inv, accs, tsks, rems] = await Promise.all([
        sbGet("patients"), sbGet("patientBill"), sbGet("optometrist"), sbGet("opticals"), sbGet("stock"), sbGet("invoices"), sbGet("accounts"), sbGet("tasks"), sbGet("reminders"),
      ]);

      const w = writesInFlight.current;
      const keep = (k, fresh, local) => (w[k] ? safeArray(local) : (Array.isArray(fresh) ? fresh : safeArray(local)));
      setData(d => ({
        ...d,
        patients:    keep("patients",    pts,   d.patients),
        patientBill: keep("patientBill", bills, d.patientBill),
        optometrist: keep("optometrist", optom, d.optometrist),
        opticals:    keep("opticals",    optcl, d.opticals),
        stock:       keep("stock",       stk,   d.stock),
        invoices:    keep("invoices",    inv,   d.invoices),
        tasks:       keep("tasks",       tsks,  d.tasks),
        reminders:   keep("reminders",   rems,  d.reminders),
      }));

      if (Array.isArray(accs) && accs.length > 0 && !accountsWriteInFlight.current) { setAccounts(accs); LS.set("opti_accounts", accs); }
      setLastSync(new Date()); setSbStatus("ok");
    } catch(e) { setSbStatus("error"); }
    setSyncing(false);
  };

  const syncRef = useRef(syncFromCloud);
  useEffect(() => { syncRef.current = syncFromCloud; });

  useEffect(() => {
    if (!sbCreds.url || !sbCreds.key) return;
    initSB(sbCreds.url, sbCreds.key);
    syncRef.current(sbCreds.url, sbCreds.key);

    // Live updates: when any table changes on the server, pull the latest
    // immediately (debounced ~600ms so a burst of changes triggers one sync).
    let liveTimer = null;
    const onLiveChange = () => {
      if (liveTimer) return;
      liveTimer = setTimeout(() => {
        liveTimer = null;
        syncRef.current(sbCreds.url, sbCreds.key);
      }, 600);
    };
    startRealtime(sbCreds.url, sbCreds.key, onLiveChange);

    // Fallback poll (in case realtime is not enabled on the project / drops).
    const id = setInterval(() => syncRef.current(sbCreds.url, sbCreds.key), 8000);
    return () => {
      clearInterval(id);
      if (liveTimer) clearTimeout(liveTimer);
      stopRealtime();
    };
  }, [sbCreds.url, sbCreds.key]);

  const connectSupabase = async (url, key) => {
    setSbStatus("testing");
    const cleanUrl = url.replace(/\/$/, "");
    initSB(cleanUrl, key);
    try {
      const r = await fetch(`${cleanUrl}/rest/v1/patients?select=id&limit=1`, { headers: { "apikey": key, "Authorization": `Bearer ${key}`, "Content-Type": "application/json" } });
      if (r.status < 500) {
        setSbCreds({ url: cleanUrl, key }); setSbStatus("ok");
        await sbUpsertMany("accounts", accounts); await syncFromCloud(cleanUrl, key); return true;
      }
      setSbStatus("error"); _sb = null; return false;
    } catch(e) {
      if (cleanUrl.includes("supabase.co") && key.length > 100) {
        initSB(cleanUrl, key); setSbCreds({ url: cleanUrl, key }); setSbStatus("ok");
        await sbUpsertMany("accounts", accounts).catch(() => {}); await syncFromCloud(cleanUrl, key); return true;
      }
      setSbStatus("error"); _sb = null; return false;
    }
  };

  const syncFromSupabase = async () => syncFromCloud(sbCreds.url, sbCreds.key);

  const pushToSupabase = async () => {
    if (!sbReady()) return;
    setSbStatus("pushing");
    try {
      await Promise.all([
        sbUpsertMany("patients", safeArray(data.patients)), sbUpsertMany("patientBill", safeArray(data.patientBill)),
        sbUpsertMany("optometrist", safeArray(data.optometrist)), sbUpsertMany("opticals", safeArray(data.opticals)),
        sbUpsertMany("stock", safeArray(data.stock)), sbUpsertMany("invoices", safeArray(data.invoices)),
        sbUpsertMany("accounts", safeArray(accounts)), sbUpsertMany("tasks", safeArray(data.tasks)), sbUpsertMany("reminders", safeArray(data.reminders)),
      ]);
      setSbStatus("ok"); await syncFromCloud(sbCreds.url, sbCreds.key);
    } catch { setSbStatus("error"); }
  };

  const audit = useCallback((action, detail = {}) => {
    if (!session) return;
    const entry = { id: uid(), action, detail, userId: session.id, userName: session.name, branch: session.branch || "All", at: ts() };
    setAuditLog(a => [entry, ...safeArray(a)].slice(0, 500));
    sbInsert("audit_log", entry).catch(() => {});
  }, [session]);

  // Tracks tables with an in-flight write so the 4s background poll cannot
  // overwrite a just-edited/just-deleted row with stale cloud data.
  const markWrite = (key) => {
    writesInFlight.current[key] = (writesInFlight.current[key] || 0) + 1;
  };
  const releaseWrite = (key) => {
    // Keep the lock for a short tail so a poll already in-flight cannot win.
    setTimeout(() => {
      writesInFlight.current[key] = Math.max(0, (writesInFlight.current[key] || 1) - 1);
    }, 1500);
  };

  const mutate = useCallback((key, fn, newRecord, deleteId) => {
    setData(d => {
      const updated = typeof fn === "function" ? fn(safeArray(d[key])) : fn;
      if (sbReady()) {
        markWrite(key);
        if (deleteId) {
          sbDelete(key, deleteId).finally(() => releaseWrite(key));
        } else if (newRecord) {
          sbUpsertOne(key, newRecord).then(result => {
            if (!result.ok) {
              alert(`Warning: This record could not be saved to the cloud.\n\nReason: ${result.error}\n\nIt is only stored on this device for now. This is usually caused by a missing column in the Supabase "${SB_TABLES[key] || key}" table.`);
            } else if (result.removedColumns && result.removedColumns.length) {
              alert(`Saved — but these field(s) don't exist yet in the Supabase "${SB_TABLES[key] || key}" table, so they were NOT synced to the cloud:\n\n${result.removedColumns.join(", ")}\n\nThey're kept on this device for now, but may get overwritten next time data syncs from the cloud. Ask your admin to add these columns in Supabase, then re-save this record.`);
            }
          }).finally(() => releaseWrite(key));
        } else if (Array.isArray(updated)) {
          sbUpsertMany(key, updated).catch(() => {}).finally(() => releaseWrite(key));
        } else {
          releaseWrite(key);
        }
      }
      return { ...d, [key]: updated };
    });
  }, []);


  // Surfaces real Supabase errors so a failed write never looks like
  // "data got wiped" — the user is told exactly what happened.
  const updateAccounts = useCallback((updater) => {
    setAccounts(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const cleanNext = safeArray(next, DEFAULT_ACCOUNTS);
      if (sbReady()) {
        accountsWriteInFlight.current = true;
        sbUpsertMany("accounts", cleanNext).then(result => {
          accountsWriteInFlight.current = false;
          if (!result.ok) {
            alert(`Warning: Staff changes could not be saved to the cloud.\n\nReason: ${result.error}\n\nYour change is only stored on this device for now and may be lost on next sync. This is usually caused by a missing column in the Supabase "accounts" table — ask your admin to check the database schema.`);
          }
        });
      }
      return cleanNext;
    });
  }, []);

  const login = useCallback(async (acc) => {
    const s = { ...acc, loginTime: ts() };
    LS.sess(s); setSession(s); setView("dashboard");
    audit("LOGIN", {});
    if (sbCreds.url && sbCreds.key) syncFromCloud(sbCreds.url, sbCreds.key);
  }, [sbCreds, audit]);

  const logout = useCallback(() => { audit("LOGOUT", {}); LS.sess(null); setSession(null); setView("dashboard"); }, [audit]);

  const can = useCallback((section, action) => {
    if (!session) return false;
    if (session.role === "owner") return true;
    return session.perms?.[section]?.[action] === true;
  }, [session]);

  const [loginAccounts, setLoginAccounts] = useState(accounts);
  useEffect(() => {
    if (!sbCreds.url || !sbCreds.key) { setLoginAccounts(accounts); return; }
    initSB(sbCreds.url, sbCreds.key);
    sbGet("accounts").then(accs => {
      if (Array.isArray(accs) && accs.length > 0) { setLoginAccounts(accs); setAccounts(accs); LS.set("opti_accounts", accs); }
      else { setLoginAccounts(accounts); }
    }).catch(() => setLoginAccounts(accounts));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!session) return <LoginScreen accounts={loginAccounts} onLogin={login} sbCreds={sbCreds} setSbCreds={setSbCreds} />;

  const sharedProps = { session, data, mutate, can, audit, fieldVis, onSync: () => syncFromCloud(sbCreds.url, sbCreds.key), syncing };

  return (
    <Shell session={session} onLogout={logout} view={view} setView={setViewNav} can={can} sbStatus={sbStatus} syncing={syncing} lastSync={lastSync} onManualSync={() => syncFromCloud(sbCreds.url, sbCreds.key)}>
      {view === "dashboard"    && <Dashboard session={session} data={data} setView={navTo} auditLog={auditLog} dashCms={dashCms} />}
      {view === "patientStatus"&& <PatientStatusSection session={session} data={data} onSync={() => syncFromCloud(sbCreds.url, sbCreds.key)} syncing={syncing} />}
      {view === "counselling"  && hasMDAccess(session) && <CounsellingSection {...sharedProps} />}
      {view === "dashcms"      && hasMDAccess(session) && <DashboardCMS dashCms={dashCms} setDashCms={setDashCms} />}
      {view === "patients"     && <PatientsSection     {...sharedProps} highlightToday={navToday} />}
      {view === "patientBill"  && <PatientBillSection  {...sharedProps} highlightToday={navToday} />}
      {view === "optometrist"  && <OptometristSection  {...sharedProps} />}
      {view === "opticals"     && <OpticalsSection     {...sharedProps} />}
      {view === "lensSale"     && <LensSaleSection     {...sharedProps} />}
      {view === "opticalsStatus" && <OpticalsStatusSection {...sharedProps} />}
      {view === "inventory"    && <InventorySection    {...sharedProps} />}
      {view === "purchaseOrders" && <PurchaseOrderSection {...sharedProps} />}
      {view === "invoices"     && <InvoicesSection     {...sharedProps} />}
      {view === "alerts"       && <AlertsSection       {...sharedProps} />}
      {view === "tasks"        && <TasksSection        {...sharedProps} accounts={accounts} />}
      {view === "reminders"    && <RemindersSection    {...sharedProps} />}
      {view === "auditlog"     && hasOwnerOrMD(session) && <AuditLogSection auditLog={auditLog} accounts={accounts} />}
      {view === "dashbuilder"  && hasMDAccess(session) && <DashboardBuilder fieldVis={fieldVis} setFieldVis={setFieldVis} accounts={accounts} setAccounts={updateAccounts} />}
      {view === "users"        && hasOwnerOrMD(session) && <UsersSection accounts={accounts} setAccounts={updateAccounts} audit={audit} />}
      {view === "supabase"     && hasMDAccess(session) && <SupabaseSection sbCreds={sbCreds} sbStatus={sbStatus} onConnect={connectSupabase} onSync={syncFromSupabase} onPush={pushToSupabase} />}
      {view === "launchguide"  && <LaunchGuide />}
      <ReminderAlerts session={session} data={data} setView={setViewNav} />
    </Shell>
  );
}

function LoginScreen({ accounts, onLogin, sbCreds, setSbCreds }) {
  const [userId,   setUserId]   = useState("");
  const [password, setPassword] = useState("");
  const [branch,   setBranch]   = useState(BRANCHES[0]);
  const [err,      setErr]      = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [liveAccs, setLiveAccs] = useState(safeArray(accounts, DEFAULT_ACCOUNTS));
  const [loading,  setLoading]  = useState(false);
  const [showCloud, setShowCloud] = useState(!sbCreds?.url);
  const [cloudUrl,  setCloudUrl]  = useState(sbCreds?.url  || "");
  const [cloudKey,  setCloudKey]  = useState(sbCreds?.key  || "");
  const [cloudMsg,  setCloudMsg]  = useState("");

  const connectCloud = async () => {
    if (!cloudUrl || !cloudKey) { setCloudMsg("Enter both URL and API key."); return; }
    setLoading(true); setCloudMsg("Connecting…");
    const cleanUrl = cloudUrl.replace(/\/$/, "");
    initSB(cleanUrl, cloudKey);
    try {
      const accs = await sbGet("accounts");
      if (Array.isArray(accs) && accs.length > 0) {
        setLiveAccs(accs); setSbCreds({ url: cleanUrl, key: cloudKey });
        LS.set("opti_sb", { url: cleanUrl, key: cloudKey }); LS.set("opti_accounts", accs);
        setCloudMsg("Connected ✓ — accounts loaded from cloud."); setShowCloud(false);
      } else {
        setSbCreds({ url: cleanUrl, key: cloudKey }); LS.set("opti_sb", { url: cleanUrl, key: cloudKey });
        setCloudMsg("Connected ✓ (no accounts in cloud yet — using defaults)."); setShowCloud(false);
      }
    } catch(e) { setCloudMsg("Connection failed. Check URL and key."); }
    setLoading(false);
  };

  const doLogin = () => {
    const all = safeArray(liveAccs, DEFAULT_ACCOUNTS);
    const acc = all.find(a => a.id === userId.trim() && a.password === password);
    if (!acc) { setErr("Invalid user ID or password."); return; }
    if (acc.role === "staff" && branch && acc.branch !== branch) { setErr(`This account belongs to ${acc.branch}.`); return; }
    onLogin(acc);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0e0c", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{GCSS}</style>
      <div style={{ width: 420, background: "#fff", borderRadius: 24, padding: "42px 38px", boxShadow: "0 40px 100px rgba(0,0,0,.5)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src={BRAND_LOGO} alt={BRAND_NAME} style={{ width: 84, height: 84, borderRadius: "50%", margin: "0 auto 12px", display: "block", objectFit: "cover" }} />
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>{BRAND_NAME}</div>
          <div style={{ fontSize: 11, color: "#9b8e82", marginTop: 4 }}>{BRAND_TAG} · v{APP_VER}</div>
        </div>
        <div style={{ marginBottom: 18, background: "#f0ede8", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: sbCreds?.url ? "#16a34a" : "#d97706" }}>{sbCreds?.url ? "☁ Cloud Connected" : "☁ Cloud Not Connected"}</div>
            <button style={{ fontSize: 11, background: "none", border: "none", color: "#6b5e52", cursor: "pointer", textDecoration: "underline" }} onClick={() => setShowCloud(s => !s)}>{showCloud ? "Hide" : "Configure"}</button>
          </div>
          {showCloud && (
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              <div style={{ fontSize: 11, color: "#9b8e82" }}>Enter your Supabase credentials to sync data.</div>
              <input type="text" placeholder="https://xxxx.supabase.co" value={cloudUrl} onChange={e => setCloudUrl(e.target.value)} style={{ fontSize: 12 }} />
              <input type="password" placeholder="anon public key (eyJ…)" value={cloudKey} onChange={e => setCloudKey(e.target.value)} style={{ fontSize: 12 }} />
              <button className="btn btn-dark btn-sm" onClick={connectCloud} disabled={loading}>{loading ? "Connecting…" : "Connect to Cloud"}</button>
              {cloudMsg && <div style={{ fontSize: 11, color: cloudMsg.includes("✓") ? "#16a34a" : "#dc2626" }}>{cloudMsg}</div>}
            </div>
          )}
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          <div><label>Branch</label>
            <select value={branch} onChange={e => setBranch(e.target.value)}>
              <option value="">— Owner Login (no branch) —</option>
              {BRANCHES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div><label>User ID</label>
            <input type="text" placeholder="owner / staff_kkd1" value={userId} onChange={e => { setUserId(e.target.value); setErr(""); }} />
          </div>
          <div><label>Password</label>
            <div style={{ position: "relative" }}>
              <input type={showPw ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && doLogin()} style={{ paddingRight: 42 }} />
              <button onClick={() => setShowPw(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#9b8e82", fontSize: 16 }}>{showPw ? "🙈" : "👁"}</button>
            </div>
          </div>
        </div>
        {err && <div style={{ marginTop: 10, fontSize: 12, color: "#dc2626", background: "#fee2e2", padding: "8px 12px", borderRadius: 8 }}>{err}</div>}
        <button className="btn btn-dark" style={{ width: "100%", marginTop: 18, padding: 12 }} onClick={doLogin}>Login</button>
      </div>
    </div>
  );
}

function Shell({ session, onLogout, view, setView, can, sbStatus, syncing, lastSync, onManualSync, children }) {
  const isOwner = session.role === "owner";
  const NAV = [
    { id: "dashboard",    label: "Dashboard",        icon: "⬡", show: true },
    { id: "patients",     label: "OP Registration",  icon: "◉", show: can("patients", "view") },
    { id: "patientBill",  label: "K Sheet Entry",    icon: "🧾", show: can("patientBill", "view") },
    
    { id: "opticals",     label: "Opticals",         icon: "🔭", show: can("opticals", "view") },
    { id: "lensSale",     label: "Lens Sale",        icon: "🔍", show: can("opticals", "view") },
    { id: "opticalsStatus",label: "Opticals Status", icon: "📦", show: can("opticals", "view") },
    { id: "inventory",    label: "Inventory",        icon: "▦", show: can("inventory", "view") },
    { id: "purchaseOrders",label: "Purchase Orders", icon: "🧾", show: can("inventory", "view") },
    { id: "invoices",     label: "Sales & Invoices", icon: "◆", show: can("invoices", "view") },
    { id: "alerts",       label: "Low Stock Alerts", icon: "▲", show: can("alerts", "view") },
    { id: "tasks",        label: "Tasks",            icon: "📌", show: true },
    { id: "reminders",    label: "Reminders",        icon: "🔔", show: true },
    { id: "patientStatus",label: "Patient Status",   icon: "🚦", show: true },
    { id: "counselling",  label: "Counselling Room", icon: "💬", show: hasMDAccess(session) },
    { id: "divider" },
    { id: "auditlog",    label: "Audit Log",        icon: "📋", show: hasOwnerOrMD(session) },
    { id: "dashbuilder", label: "Dashboard Builder",icon: "🏗", show: hasMDAccess(session) },
    { id: "dashcms",     label: "Dashboard CMS",    icon: "🎨", show: hasMDAccess(session) },
    { id: "users",       label: "Manage Staff",     icon: "👥", show: hasOwnerOrMD(session) },
    { id: "supabase",    label: "Cloud Sync",       icon: "☁", show: hasMDAccess(session), badge: sbStatus === "error" ? "!" : 0, badgeColor: "#dc2626" },
    { id: "launchguide", label: "Launch Guide",     icon: "🚀", show: true },
  ];
  const sbDot = { ok: "#16a34a", error: "#dc2626", testing: "#d97706", pushing: "#d97706", syncing: "#d97706" }[sbStatus] || "#9b8e82";

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", background: "#f0ede8", color: "#1a1714" }}>
      <style>{GCSS}</style>
      <aside style={{ width: 236, background: "#fff", borderRight: "1px solid #e8e2db", padding: "18px 10px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", flexShrink: 0, overflowY: "auto" }}>
        <div style={{ padding: "0 8px 14px", borderBottom: "1px solid #f0ede8", marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <img src={BRAND_LOGO} alt={BRAND_NAME} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, fontWeight: 700, lineHeight: 1.1 }}>{BRAND_NAME}</div>
            <div style={{ fontSize: 9, color: "#9b8e82", marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>{BRAND_TAG} · v{APP_VER} <span style={{ width: 7, height: 7, borderRadius: "50%", background: sbDot, display: "inline-block" }} title={`Supabase: ${sbStatus}`} /></div>
          </div>
        </div>
        <div style={{ margin: "0 4px 12px", background: "#f0ede8", borderRadius: 10, padding: "9px 12px" }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{session.name}</div>
          <div style={{ fontSize: 11, color: "#9b8e82", marginTop: 2 }}>{session.designation || (isOwner ? "Owner" : "Staff")} · {isOwner ? "All Branches" : session.branch}</div>
          {isOwner && <span style={{ display: "inline-block", marginTop: 4, background: "#1a1714", color: "#f0ede8", borderRadius: 20, fontSize: 10, padding: "1px 8px", fontWeight: 700 }}>OWNER</span>}
        </div>
        {NAV.filter(n => n.id === "divider" || n.show).map(n =>
          n.id === "divider" ? <div key="div" style={{ margin: "6px 8px", borderTop: "1px solid #f0ede8" }} /> : 
          <button key={n.id} className={`nav-item ${view === n.id ? "active" : ""}`} onClick={() => setView(n.id)}>
            <span style={{ fontSize: 13 }}>{n.icon}</span>{n.label}
            {n.badge > 0 && <span className="badge" style={{ marginLeft: "auto", background: n.badgeColor || "#e55e3a" }}>{n.badge}</span>}
          </button>
        )}
        <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid #f0ede8" }}>
          <button className="btn btn-outline btn-sm" style={{ width: "100%", marginBottom: 8 }} onClick={onManualSync} disabled={syncing}>{syncing ? "⟳ Syncing…" : "⟳ Sync Now"}</button>
          {lastSync && <div style={{ fontSize: 10, color: "#b5a99e", textAlign: "center", marginBottom: 8 }}>Last sync: {lastSync.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>}
          <button className="btn btn-outline btn-sm" style={{ width: "100%" }} onClick={onLogout}>🔒 Logout</button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: "26px 30px", overflowY: "auto", maxWidth: "calc(100vw - 236px)" }}>{children}</main>
    </div>
  );
}

function Dashboard({ session, data, setView, auditLog, dashCms }) {
  const isOwner = session.role === "owner";
  const myBranch = session.branch;
  const cms = dashCms || DEFAULT_DASH_CMS;
  const flt = arr => isOwner ? safeArray(arr) : safeArray(arr).filter(x => x.branch === myBranch);
  const today = todayStr();

  // Live clock — re-renders every second so the dashboard always reflects "now".
  const [, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(id); }, []);

  // Strictly uses the `date` column value (date part only). Shared with isTodayDate.
  const isToday = (d) => isTodayDate(d);

  const allPts      = dedupePatientVisits(flt(data.patients).filter(x => x.status === "approved"));
  const ptsToday    = allPts.filter(x => isToday(x.date));
  const billsToday  = flt(data.patientBill).filter(x => x.status === "approved" && isToday(x.date));
  const invsToday   = flt(data.invoices).filter(x => x.approvalStatus === "approved" && x.status === "Paid" && isToday(x.date));
  const invRevToday = invsToday.reduce((s, i) => s + safeArray(i.items).reduce((a, x) => a + x.qty * x.price, 0) - (i.discount || 0), 0);
  // Revenue (Today) = paid invoices + OP registration amount + opticals advance + opticals balance collected on delivery
  const opRegRevToday = ptsToday.reduce((s, p) => s + (parseFloat(p.paymentAmount) || 0), 0);
  const balanceVal = (o) => { const b = o.balance !== "" && o.balance != null ? parseFloat(o.balance) : (parseFloat(o.totalPrice) || 0) - (parseFloat(o.advance) || 0); return Math.max(0, isNaN(b) ? 0 : b); };
  // Use the `date` column only (no timestamp fallback) so "today" reflects the column value, not when the row was created.
  const opticalsAdvToday = flt(data.opticals).filter(o => isToday(o.date)).reduce((s, o) => s + (parseFloat(o.advance) || 0), 0);
  const opticalsBalToday = flt(data.opticals).filter(o => o.deliveryStatus === "Delivered" && isToday(o.date)).reduce((s, o) => s + balanceVal(o), 0);
  const revToday    = invRevToday + opRegRevToday + opticalsAdvToday + opticalsBalToday;
  const revisitToday = ptsToday.filter(x => {
    const v = (x.visitType || "").toLowerCase();
    return v && v !== "new patient" && (v.includes("visit") || v.includes("review") || v.includes("camp"));
  });
  const newRegToday = ptsToday.filter(x => !revisitToday.includes(x));

  const tasksToday = flt(data.tasks).filter(t => isToday(t.deadline) || isToday(t.completedAt) || isToday(t.createdAt));
  const remToday   = flt(data.reminders).filter(r => isToday(r.reminderDate) || isToday(r.completedAt) || isToday(r.createdAt) || reminderOverdue(r))
                       .sort((a, b) => (reminderOverdue(b) ? 1 : 0) - (reminderOverdue(a) ? 1 : 0));
  const auditToday = safeArray(auditLog).filter(a => isToday(a.at)).slice(0, 12);

  const blockValues = { opReg: newRegToday.length, revisit: revisitToday.length, ksheet: billsToday.length, revenue: currency(revToday) };
  const blockLinks  = { opReg: "patients", revisit: "patients", ksheet: "patientBill", revenue: "invoices" };
  const blocks = Object.entries(cms.blocks || {})
    .filter(([, b]) => b.enabled !== false)
    .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
    .map(([key, b]) => ({ key, ...b, value: blockValues[key] ?? 0, click: () => setView(b.link || blockLinks[key] || "dashboard", ["opReg", "ksheet", "revisit"].includes(key)) }));

  const sortedPanels = Object.entries(cms.panels || {})
    .filter(([, p]) => p.enabled !== false && (!p.ownerOnly || hasMDAccess(session)))
    .sort((a, b) => (a[1].order || 0) - (b[1].order || 0));

  // Today's K Sheets with advice (owner view)
  const adviceToday = billsToday
    .filter(k => (k.advice || k.ophthalmologist || k.fundus))
    .map(k => ({ ...k, _status: getPatientStatus(k, data) }));

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom: 22, flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700 }}>Welcome, {session.name} 👋</div>
          <div style={{ fontSize: 13, color: "#9b8e82", marginTop: 3 }}>{isOwner ? "All Branches" : myBranch} · Live · {ts()}</div>
        </div>
        {hasMDAccess(session) && (
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn btn-outline btn-sm" onClick={() => setView("dashcms")}>🎨 Edit Dashboard (CMS)</button>
            <button className="btn btn-outline btn-sm" onClick={() => setView("dashbuilder")}>⚙ Field Builder</button>
          </div>
        )}
      </div>

      {hasMDAccess(session) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, marginBottom: 22 }}>
          {blocks.map(b => (
            <div key={b.key} onClick={b.click} style={{ cursor:"pointer", borderRadius: 14, padding: "16px 18px", background: b.bg, color: b.color, boxShadow: "0 2px 8px rgba(0,0,0,.05)", transition:"transform .15s", border:"1px solid rgba(255,255,255,.5)" }}
                 onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform=""}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em" }}>{b.title}</div>
                <div style={{ fontSize: 20 }}>{b.icon}</div>
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 34, fontWeight: 800 }}>{b.value}</div>
              <div style={{ fontSize: 11, marginTop: 4, opacity: .8 }}>{b.sub}</div>
            </div>
          ))}
        </div>
      )}

      {hasMDAccess(session) && (
        <div className="card" style={{ marginBottom: 18, borderTop: "4px solid #5b21b6" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#5b21b6" }}>🚦 Patient Status (Today)</div>
            <button className="btn btn-outline btn-sm" onClick={() => setView("patientStatus")}>Open Full View</button>
          </div>
          {(() => {
            const todayPts = dedupePatientVisits(flt(data.patients)).filter(x => isToday(x.date)).map(p => ({ ...p, _status: getPatientStatus(p, data) }));
            if (!todayPts.length) return <div style={{ fontSize:12, color:"#9b8e82" }}>No patients registered today.</div>;
            return (
              <div style={{ overflowX:"auto" }}>
                <table>
                  <thead><tr><th>MR No</th><th>Patient ID</th><th>Name</th><th>Phone</th><th>Status</th></tr></thead>
                  <tbody>
                    {todayPts.slice(0, 12).map(p => (
                      <tr key={p.id}>
                        <td style={{ fontFamily:"monospace", fontWeight:700 }}>{p.mrNo || "—"}</td>
                        <td style={{ fontFamily:"monospace", color:"#1d4ed8" }}>{p.patientId || "—"}</td>
                        <td style={{ fontWeight:600 }}>{p.name}</td>
                        <td>{p.phone}</td>
                        <td><span className="tag" style={{ background:p._status.bg, color:p._status.color }}>{p._status.label}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {hasMDAccess(session) && (() => {
        const balOf = (o) => { const b = o.balance !== "" && o.balance != null ? parseFloat(o.balance) : (parseFloat(o.totalPrice) || 0) - (parseFloat(o.advance) || 0); return Math.max(0, isNaN(b) ? 0 : b); };
        const optRows = flt(data.opticals).filter(o => (o.deliveryStatus || "Not Ready") !== "Delivered");
        return (
          <div className="card" style={{ marginBottom: 18, borderTop: "4px solid #b45309" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#b45309" }}>📦 Opticals Status</div>
              <button className="btn btn-outline btn-sm" onClick={() => setView("opticalsStatus")}>Open Full View</button>
            </div>
            {optRows.length === 0 ? <div style={{ fontSize:12, color:"#9b8e82" }}>No pending opticals.</div> : (
              <div style={{ overflowX:"auto" }}>
                <table>
                  <thead><tr><th>MR No</th><th>Patient ID</th><th>Name</th><th>Phone</th><th>Total</th><th>Advance</th><th>Balance</th><th>Delivery Status</th></tr></thead>
                  <tbody>
                    {optRows.slice(0, 12).map(o => { const bal = balOf(o); return (
                      <tr key={o.id}>
                        <td style={{ fontFamily:"monospace", fontWeight:700 }}>{o.mrNo || "—"}</td>
                        <td style={{ fontFamily:"monospace", color:"#1d4ed8" }}>{o.patientId || "—"}</td>
                        <td style={{ fontWeight:600 }}>{o.name}</td>
                        <td>{o.phone || "—"}</td>
                        <td>{o.totalPrice ? `₹${o.totalPrice}` : "—"}</td>
                        <td>{o.advance ? `₹${o.advance}` : "—"}</td>
                        <td style={{ fontWeight:700, color: bal > 0 ? "#dc2626" : "#16a34a" }}>{bal > 0 ? `₹${bal}` : "Fully Paid"}</td>
                        <td><span className="tag" style={{ background: o.deliveryStatus === "Fixing Completed But Not Delivered" ? "#fef9c3" : "#fee2e2", color: o.deliveryStatus === "Fixing Completed But Not Delivered" ? "#854d0e" : "#7f1d1d" }}>{o.deliveryStatus || "Not Ready"}</span></td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}







      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 18, marginBottom: 18 }}>
        {sortedPanels.map(([key, panel]) => {
          if (key === "tasks") {
            return (
              <div key={key} className="card" style={{ borderTop: `4px solid ${panel.accent}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: panel.accent }}>{panel.title}</div>
                  <button className="btn btn-outline btn-sm" onClick={() => setView("tasks")}>View all</button>
                </div>
                {tasksToday.length === 0 && <div style={{ fontSize:12, color:"#9b8e82" }}>No tasks for today.</div>}
                {tasksToday.map(t => {
                  const c = deadlineColor(t, "deadline");
                  return (
                    <div key={t.id} style={{ padding:"8px 10px", borderRadius:8, background:c.bg, marginBottom:6, borderLeft:`4px solid ${c.border}` }}>
                      <div style={{ fontWeight:700, fontSize:13, color:c.color, textDecoration: t.status==="done" ? "line-through" : "none" }}>{t.title}</div>
                      <div style={{ fontSize:11, color:c.color, opacity:.85 }}>{c.label} · Due {t.deadline} · {t.priority}</div>
                    </div>
                  );
                })}
              </div>
            );
          }
          if (key === "reminders") {
            return (
              <div key={key} className="card" style={{ borderTop: `4px solid ${panel.accent}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: panel.accent }}>{panel.title}</div>
                  <button className="btn btn-outline btn-sm" onClick={() => setView("reminders")}>View all</button>
                </div>
                {remToday.length === 0 && <div style={{ fontSize:12, color:"#9b8e82" }}>No reminders for today.</div>}
                {remToday.map(r => {
                  const c = deadlineColor(r, "reminderDate");
                  return (
                    <div key={r.id} style={{ padding:"8px 10px", borderRadius:8, background:c.bg, marginBottom:6, borderLeft:`4px solid ${c.border}` }}>
                      <div style={{ fontWeight:700, fontSize:13, color:c.color, textDecoration: r.status==="done" ? "line-through" : "none" }}>{r.name} <span style={{ fontWeight:400, fontSize:11, opacity:.8 }}>({r.reminderType})</span></div>
                      <div style={{ fontSize:11, color:c.color, opacity:.85 }}>{c.label} · Due {r.reminderDate} · {r.phone || "—"}</div>
                    </div>
                  );
                })}
              </div>
            );
          }
          if (key === "advice" && isOwner) {
            return (
              <div key={key} className="card" style={{ borderTop: `4px solid ${panel.accent}`, gridColumn: "1 / -1" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: panel.accent }}>{panel.title}</div>
                  <button className="btn btn-outline btn-sm" onClick={() => setView("patientBill")}>Open K Sheets</button>
                </div>
                {adviceToday.length === 0 && <div style={{ fontSize:12, color:"#9b8e82" }}>No K Sheet advice today.</div>}
                {adviceToday.length > 0 && (
                  <div style={{ overflowX:"auto" }}>
                    <table>
                      <thead><tr><th>MR No</th><th>Name</th><th>Patient Status</th><th>Advice</th><th>Ophthalmologist</th></tr></thead>
                      <tbody>
                        {adviceToday.map(k => (
                          <tr key={k.id}>
                            <td style={{ fontFamily:"monospace", fontWeight:700 }}>{k.mrNo || "—"}</td>
                            <td style={{ fontWeight:600 }}>{k.name}</td>
                            <td><span className="tag" style={{ background: k._status.bg, color: k._status.color }}>{k._status.label}</span></td>
                            <td style={{ fontSize:12, color:"#1a1714", maxWidth: 360, whiteSpace:"pre-wrap" }}>{k.advice || "—"}</td>
                            <td style={{ fontSize:12, color:"#6b5e52" }}>{k.ophthalmologist || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          }
          if (key === "branchOverview" && isOwner) {
            return (
              <div key={key} className="card" style={{ borderTop: `4px solid ${panel.accent}` }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14, color: panel.accent }}>{panel.title}</div>
                {BRANCHES.map(br => {
                  const bPts   = safeArray(data.patients).filter(x => x.branch === br && x.status === "approved" && isToday(x.date));
                  const bBills = safeArray(data.patientBill).filter(x => x.branch === br && x.status === "approved" && isToday(x.date));
                  const bRev   = safeArray(data.invoices).filter(x => x.branch === br && x.approvalStatus === "approved" && x.status === "Paid" && isToday(x.date));
                  return (
                    <div key={br} style={{ padding: "10px 0", borderBottom: "1px solid #f0ede8" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{br}</div>
                      <div style={{ display: "flex", gap: 10 }}>
                        {[["OP Reg", bPts.length, "#92400e", "#fef3c7"], ["K Sheets", bBills.length, "#14532d", "#dcfce7"], ["Invoices", bRev.length, "#9d174d", "#fce7f3"]].map(([l, v, c, bg]) => (
                          <div key={l} style={{ flex: 1, background: bg, borderRadius: 8, padding: "8px 10px" }}>
                            <div style={{ fontSize: 10, color: c, fontWeight: 700 }}>{l}</div>
                            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }
          if (key === "activity" && isOwner) {
            return (
              <div key={key} className="card" style={{ borderTop: `4px solid ${panel.accent}` }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14, color: panel.accent }}>{panel.title}</div>
                {auditToday.length === 0 && <div style={{ fontSize: 13, color: "#9b8e82" }}>No activity today.</div>}
                {auditToday.map(a => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0ede8", fontSize: 12 }}>
                    <div>
                      <span style={{ fontWeight: 700, marginRight: 6, color: { LOGIN: "#1d4ed8", LOGOUT: "#9b8e82", ADD: "#16a34a", DELETE: "#dc2626", EDIT: "#d97706", TASK_ASSIGN:"#d97706", TASK_COMPLETE:"#16a34a", REMINDER_ADD:"#1d4ed8" }[a.action] || "#1a1714" }}>{a.action}</span>
                      <span style={{ color: "#6b5e52" }}>{a.userName}</span>
                      {a.branch !== "All" && <span style={{ color: "#b5a99e", marginLeft: 5 }}>· {a.branch}</span>}
                    </div>
                    <div style={{ color: "#b5a99e", fontSize: 11 }}>{a.at}</div>
                  </div>
                ))}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}


function AuditLogSection({ auditLog, accounts }) {
  const [filter, setFilter] = useState("ALL");
  const [userF,  setUserF]  = useState("ALL");
  const actions = ["ALL", "LOGIN", "LOGOUT", "ADD", "EDIT", "DELETE"];
  const filtered = safeArray(auditLog).filter(a => filter === "ALL" || a.action === filter).filter(a => userF  === "ALL" || a.userId === userF);
  const actionColor = { LOGIN: "#1d4ed8", LOGOUT: "#9b8e82", ADD: "#16a34a", EDIT: "#d97706", DELETE: "#dc2626" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div className="section-title">Audit Log</div>
        <button className="btn btn-outline btn-sm" onClick={() => exportCSV(filtered.map(({ id, ...r }) => r), "audit_log.csv")}>⬇ CSV</button>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {actions.map(a => <button key={a} className={`btn btn-sm ${filter === a ? "btn-dark" : "btn-outline"}`} onClick={() => setFilter(a)}>{a}</button>)}
        </div>
        <select value={userF} onChange={e => setUserF(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="ALL">All Users</option>
          {safeArray(accounts).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th>Time</th><th>Action</th><th>User</th><th>Branch</th><th>Detail</th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={5} style={{ color: "#9b8e82", textAlign: "center", padding: 24 }}>No entries.</td></tr>}
            {filtered.map(a => (
              <tr key={a.id}>
                <td style={{ fontSize: 11, whiteSpace: "nowrap", color: "#9b8e82" }}>{a.at}</td>
                <td><span style={{ background: `${actionColor[a.action] || "#9b8e82"}20`, color: actionColor[a.action] || "#9b8e82", borderRadius: 20, fontSize: 11, padding: "2px 9px", fontWeight: 700 }}>{a.action}</span></td>
                <td style={{ fontWeight: 600 }}>{a.userName}</td>
                <td style={{ fontSize: 12, color: "#9b8e82" }}>{a.branch}</td>
                <td style={{ fontSize: 12, color: "#6b5e52" }}>{Object.entries(a.detail || {}).map(([k, v]) => `${k}: ${v}`).join(" · ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DashboardBuilder({ fieldVis, setFieldVis, accounts, setAccounts }) {
  const [tab, setTab] = useState("fields");
  const [section, setSection] = useState("patients");

  const ALL_FIELDS = {
    patients:    ["timestamp","date","time","mrNo","patientId","name","phone","address","gender","age","designation","aadharNo","ref","paymentAmount","paymentMode","paymentRefNo","branch","remarks","visitType"],
    patientBill: ["timestamp","date","time","mrNo","patientId","name","phone","address","gender","age","complaint","pastHistory"],
    optometrist: ["timestamp","mrNo","patientId","name","complaint","pastHistory"],
    opticals:    ["timestamp","billNo","mrNo","patientId","name","phone","address","totalPrice","discount","advance","advancePaymentMethod","transactionId","balance","deliveryStatus","optomName"],
    inventory:   ["sku","name","category","brand","qty","reorder","lensPower","lensType","boxNo","cost","price","location"],
    invoices:    ["id","date","patientName","items","discount","status"],
  };

  const toggleField = (sec, field) => {
    setFieldVis(fv => { const cur = fv[sec] || []; return { ...fv, [sec]: cur.includes(field) ? cur.filter(f => f !== field) : [...cur, field] }; });
  };

  const staff = safeArray(accounts).filter(a => a.role === "staff");
  const togglePerm = (id, sec, action) => {
    setAccounts(prev => safeArray(prev).map(a => {
      if (a.id !== id) return a;
      return { ...a, perms: { ...a.perms, [sec]: { ...a.perms[sec], [action]: !a.perms[sec]?.[action] } } };
    }));
  };

  return (
    <div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Dashboard Builder</div>
      <div style={{ fontSize: 13, color: "#9b8e82", marginBottom: 20 }}>Control which fields and sections each staff member can access.</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        {[{ id: "fields", label: "🔲 Field Visibility" }, { id: "perms", label: "🔐 Staff Permissions" }].map(t => (
          <button key={t.id} className={`btn btn-sm ${tab === t.id ? "btn-dark" : "btn-outline"}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {tab === "fields" && (
        <div className="card">
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {Object.keys(ALL_FIELDS).map(s => <button key={s} className={`btn btn-sm ${section === s ? "btn-dark" : "btn-outline"}`} onClick={() => setSection(s)}>{SECTION_LABELS[s]}</button>)}
          </div>
          <div style={{ fontSize: 13, color: "#9b8e82", marginBottom: 14 }}>Toggle which fields are <strong>visible in forms and tables</strong> for the <strong>{SECTION_LABELS[section]}</strong> section. Disabled fields are hidden from staff.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 10 }}>
            {(ALL_FIELDS[section] || []).map(field => {
              const on = (fieldVis[section] || []).includes(field);
              return (
                <div key={field} onClick={() => toggleField(section, field)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${on ? "#1a1714" : "#e2ddd8"}`, background: on ? "#1a1714" : "#fff", cursor: "pointer", transition: "all .15s" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: on ? "#f0ede8" : "#1a1714" }}>{field}</span><span style={{ fontSize: 18 }}>{on ? "✓" : "○"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "perms" && (
        <div>
          {staff.length === 0 && <div className="card" style={{ color: "#9b8e82", textAlign: "center", padding: 32 }}>No staff accounts yet. Add staff in Manage Staff.</div>}
          {staff.map(acc => (
            <div key={acc.id} className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{acc.name} <span style={{ fontSize: 12, fontWeight: 400, color: "#6b5e52", background: "#f0ede8", padding: "2px 8px", borderRadius: 12, marginLeft: 6 }}>{acc.designation}</span></div>
                  <div style={{ fontSize: 12, color: "#9b8e82", marginTop: 4 }}>{acc.id} · {acc.branch}</div>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead><tr><th>Section</th><th style={{ textAlign: "center" }}>👁 View</th><th style={{ textAlign: "center" }}>➕ Add</th><th style={{ textAlign: "center" }}>✏️ Edit</th></tr></thead>
                  <tbody>
                    {SECTIONS.map(sec => (
                      <tr key={sec}>
                        <td style={{ fontWeight: 600 }}>{SECTION_LABELS[sec]}</td>
                        {["view", "add", "edit"].map(action => (
                          <td key={action} style={{ textAlign: "center" }}>
                            <button onClick={() => togglePerm(acc.id, sec, action)} style={{ width: 36, height: 28, borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: acc.perms?.[sec]?.[action] ? "#dcfce7" : "#fee2e2", color: acc.perms?.[sec]?.[action] ? "#16a34a" : "#dc2626" }}>
                              {acc.perms?.[sec]?.[action] ? "✓" : "✗"}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PatientsSection({ session, data, mutate, can, audit, onSync, syncing, highlightToday }) {
  const isOwner  = session.role === "owner";
  const branch   = session.branch || "KKD_Main Branch";
  const rows = safeArray(data.patients).filter(x => (isOwner || x.branch === branch));

  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({});
  const [touch, setTouch] = useState({});
  const [msg,   setMsg]   = useState("");
  const [search,setSearch]= useState("");
  const [filterField, setFilterField] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const FS_FIELDS = [
    { key:"date", label:"Date" }, { key:"timestamp", label:"Date/Time" }, { key:"mrNo", label:"MR No" }, { key:"patientId", label:"Patient ID" },
    { key:"name", label:"Name" }, { key:"phone", label:"Phone" }, { key:"gender", label:"Gender" }, { key:"age", label:"Age" },
    { key:"designation", label:"Designation" }, { key:"aadharNo", label:"Aadhar No" }, { key:"address", label:"Address" },
    { key:"paymentMode", label:"Payment" }, { key:"paymentAmount", label:"Amount" }, { key:"ref", label:"Ref/Camp" }, { key:"visitType", label:"Visit" }, { key:"branch", label:"Branch" },
  ];
  const [dupWarning, setDupWarning] = useState(null);


  const nextPatientId = () => {
    const all = safeArray(data.patients);
    const nums = all.map(p => parseInt((p.patientId || "").replace(/\D/g,""))).filter(n => !isNaN(n));
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return `PT-${String(next).padStart(4,"0")}`;
  };

  const blank = () => ({
    timestamp: ts(), date: todayStr(), time: timeStr(), mrNo: "", patientId: nextPatientId(),
    name: "", phone: "", address: "", gender: "", age: "", designation: "", aadharNo: "", ref: "", paymentAmount: "", paymentMode: "Cash", paymentRefNo: "",
    branch: isOwner ? "KKD_Main Branch" : branch, remarks: "", visitType: "New Patient", visitCount: 1,
  });

  // Lookup gender / age from the K Sheet for a patient row
  const kInfo = (r) => safeArray(data.patientBill).map(unpackKSheetRow).find(k =>
    (r.mrNo && k.mrNo === r.mrNo) || (r.patientId && k.patientId === r.patientId) || (r.phone && k.phone === r.phone)
  ) || null;

  const F = k => e => { setForm(f => ({ ...f, [k]: e.target.value })); setDupWarning(null); };
  const T = k => () => setTouch(t => ({ ...t, [k]: true }));

  const handlePhoneBlur = () => {
    setTouch(t => ({ ...t, phone: true }));
    const match = safeArray(data.patients).find(p => p.phone === form.phone && p.id !== form.id);
    if (match && form.phone && form.phone.length === 10) {
      const newCount = (match.visitCount || 1) + 1;
      setDupWarning({ msg: `⚠ Existing patient found: ${match.name} (${match.patientId}) — Visit #${newCount}`, patient: match, visitCount: newCount });
      setForm(f => ({ ...f, visitType: newCount === 2 ? "2nd Visit" : newCount === 3 ? "3rd Visit" : `${newCount}th Visit`, visitCount: newCount }));
    }
    // Auto-fill gender / age from the K Sheet when available
    const k = safeArray(data.patientBill).map(unpackKSheetRow).find(kr => kr.phone === form.phone || (form.mrNo && kr.mrNo === form.mrNo));
    if (k) setForm(f => ({ ...f, gender: f.gender || k.gender || "", age: f.age || k.age || "" }));
  };

  const submit = () => {
    setTouch({ phone: true, name: true, address: true, mrNo: true });
    if (!validate.phone(form.phone) || !form.name.trim() || !form.address.trim() || !form.mrNo.trim()) { setMsg("Fill required fields correctly."); return; }
    if (form.visitType === "Camp" && !String(form.ref || "").trim()) { setMsg("Ref/Camp is required when Visit Type is Camp."); return; }
    if ((form.paymentMode === "Card" || form.paymentMode === "UPI") && !String(form.paymentRefNo || "").trim()) { setMsg("Payment Ref No is required for Card / UPI payments."); return; }
    if (form.id) {
      const updated = { ...form, updatedBy: session.id, updatedByName: session.name, updatedAt: ts() };
      mutate("patients", arr => arr.map(x => x.id === form.id ? { ...x, ...updated } : x), updated);
      audit("EDIT", { type: "patients", id: form.id, name: form.name });
      setModal(false); setMsg("Patient updated.");
      return;
    }
    const record = { id: uid(), ...form, status: "approved", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("patients", arr => [...arr, record], record);
    audit("ADD", { type: "patients", name: form.name });
    setModal(false); setMsg("Patient registered successfully.");
  };

  const del = id => { if (confirm("Delete patient?")) { mutate("patients", arr => arr.filter(x => x.id !== id), null, id); audit("DELETE", { type: "patients", id }); } };
  const openEdit = (row) => { setForm({ ...row, date: toISODate(row.date) || todayStr() }); setTouch({}); setMsg(""); setDupWarning(null); setModal(true); };
  const [viewRow, setViewRow] = useState(null);
  const canEdit = isOwner || can("patients", "edit");
  const canViewDetail = isOwner || can("patients", "view");

  const OP_CSV_HEADERS = ["date","time","mrNo","patientId","name","phone","address","gender","age","designation","aadharNo","visitType","ref","paymentMode","paymentAmount","paymentRefNo","branch","remarks"];
  const handleImport = () => {
    if (!can("patients","add") && !isOwner) { setMsg("No permission to import."); return; }
    importCSVFile(records => {
      if (!records.length) { setMsg("CSV is empty."); return; }
      let added = 0, skipped = 0;
      const existing = safeArray(data.patients);
      const startNum = (() => {
        const nums = existing.map(p => parseInt((p.patientId||"").replace(/\D/g,""))).filter(n => !isNaN(n));
        return nums.length ? Math.max(...nums) : 0;
      })();
      let counter = startNum;
      const newRecords = [];
      for (const r of records) {
        // Import EVERY row — duplicate MR No is allowed (reset daily) and
        // missing fields are kept blank. Only Patient ID + date are ensured.
        const mrNo = String(r.mrNo||"").trim();
        const name = String(r.name||"").trim();
        const phone = String(r.phone||"").trim();
        counter += 1;
        const rec = {
          id: uid(),
          timestamp: ts(), date: r.date || todayStr(), time: r.time || timeStr(),
          mrNo, patientId: r.patientId || `PT-${String(counter).padStart(4,"0")}`,
          name, phone, address: r.address || "",
          gender: r.gender || "", age: r.age || "",
          designation: r.designation || "", aadharNo: r.aadharNo || "",
          visitType: r.visitType || "New Patient", visitCount: 1,
          ref: r.ref || "",
          paymentMode: r.paymentMode || "Cash",
          paymentAmount: r.paymentAmount || "",
          paymentRefNo: r.paymentRefNo || "",
          branch: r.branch || (isOwner ? "KKD_Main Branch" : branch),
          remarks: r.remarks || "",
          status: "approved",
          createdBy: session.id, createdByName: session.name, createdAt: ts(),
        };
        newRecords.push(rec);
        added++;
      }
      if (newRecords.length) mutate("patients", arr => [...arr, ...newRecords]);
      audit("IMPORT_CSV", { type:"patients", added, skipped });
      setMsg(`Imported ${added} patient(s).${skipped ? ` Skipped ${skipped} empty row(s).` : ""}`);
    });
  };


  const deduped = dedupePatientVisits(rows);
  const filtered = sortRows(deduped.filter(r => matchSearch(r, search, FS_FIELDS, filterField) && inDateRange(r, dateFrom, dateTo)), sortKey, sortDir);

  return (
    <div>
      <SectionHeader
        title="OP Registration"
        onSync={onSync}
        syncing={syncing}
        onTemplate={() => downloadCSVTemplate(OP_CSV_HEADERS, "op_registration_template.csv")}
        onImport={(can("patients","add") || isOwner) ? handleImport : null}
        onExport={() => exportCSV(rows.map(({ id, ...r }) => r), "op_registration.csv")}
        onAdd={can("patients","add") ? () => { setForm(blank()); setTouch({}); setMsg(""); setDupWarning(null); setModal(true); } : null}
        msg={msg}
      />
      <FilterSortBar search={search} setSearch={setSearch} placeholder="🔍 Search by name, phone, MR No, Patient ID…" fields={FS_FIELDS} filterField={filterField} setFilterField={setFilterField} sortKey={sortKey} setSortKey={setSortKey} sortDir={sortDir} setSortDir={setSortDir} dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} />

      <div className="card" style={{ overflowX:"auto" }}>
        <table>
          <thead><tr><th>Date</th><th>MR No</th><th>Patient ID</th><th>Name</th><th>Phone</th><th>Gender</th><th>Age</th><th>Designation</th><th>Aadhar No</th><th>Address</th><th>Payment</th><th>Payment Ref No</th><th>Amount</th><th>Ref/Camp</th><th>Visit</th><th>Branch</th><th>Remarks</th><th></th></tr></thead>
          <tbody>{filtered.map(r => (
            <tr key={r.id} style={highlightToday && isTodayDate(r.date) ? { background:"#fef9c3" } : undefined}>
              <td style={{ fontSize:12, whiteSpace:"nowrap", color:"#6b5e52" }}>{r.date || r.timestamp}</td>
              <td style={{ fontWeight:700, fontFamily:"monospace" }}>{r.mrNo}</td>
              <td style={{ fontFamily:"monospace", color:"#1d4ed8", cursor: canViewDetail?"pointer":"default", textDecoration: canViewDetail?"underline":"none" }} onClick={() => canViewDetail && setViewRow(r)}>{r.patientId}</td>
              <td style={{ fontWeight:600, cursor: canViewDetail?"pointer":"default" }} onClick={() => canViewDetail && setViewRow(r)}>{r.name}</td><td>{r.phone}</td>
              {(() => { const k = kInfo(r); return (<><td>{r.gender || k?.gender || "—"}</td><td>{r.age || k?.age || "—"}</td></>); })()}
              <td>{r.designation || "—"}</td>
              <td style={{ fontFamily:"monospace" }}>{r.aadharNo || "—"}</td>
              <td style={{ maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.address}</td>
              <td><span className="tag tag-blue">{r.paymentMode}</span></td>
              <td style={{ fontSize:11, fontFamily:"monospace", color:"#9b8e82" }}>{r.paymentRefNo || "—"}</td>
              <td style={{ fontWeight:600 }}>{r.paymentAmount ? `₹${r.paymentAmount}` : "—"}</td>
              <td style={{ fontSize:12, color:"#9b8e82" }}>{r.ref || "—"}</td>
              <td><span className="tag" style={{ background:r.visitType === "Camp" ? "#fef3c7" : "#f0ede8", color:r.visitType === "Camp" ? "#92400e" : "#6b5e52" }}>{r.visitType || "New Patient"}</span></td>
              <td><span className="tag" style={{ background:"#f0ede8", color:"#6b5e52" }}>{r.branch}</span></td>
              <td style={{ fontSize:12, color:"#9b8e82", maxWidth:120, overflow:"hidden", textOverflow:"ellipsis" }}>{r.remarks || "—"}</td>
              <td style={{ display:"flex", gap:5 }}>
                <button className="btn btn-outline btn-sm" disabled={!canViewDetail} style={!canViewDetail ? { opacity:.35, cursor:"not-allowed" } : {}} onClick={() => canViewDetail && setViewRow(r)}>View</button>
                <button className="btn btn-outline btn-sm" disabled={!canEdit} style={!canEdit ? { opacity:.35, cursor:"not-allowed" } : {}} onClick={() => canEdit && openEdit(r)}>Edit</button>
                {isOwner && <button className="btn btn-danger btn-sm" onClick={() => del(r.id)}>✕</button>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {viewRow && (() => {
        const kSheets = safeArray(data.patientBill)
          .map(unpackKSheetRow)
          .filter(k => (viewRow.mrNo && k.mrNo === viewRow.mrNo) || (viewRow.patientId && k.patientId === viewRow.patientId) || (viewRow.phone && k.phone === viewRow.phone))
          .sort((a,b) => (b.timestamp||"").localeCompare(a.timestamp||""));
        const latest = kSheets[0] || null;
        return (
          <Modal title={`Patient · ${viewRow.name || viewRow.mrNo || ""}`} onClose={() => setViewRow(null)} onSave={() => setViewRow(null)} saveLabel="Close" xl>
            <PatientFullView patient={viewRow} kSheet={latest} kSheetCount={kSheets.length} />
          </Modal>
        );
      })()}

      {modal && (
        <Modal title="OP Registration" onClose={() => setModal(false)} onSave={submit} saveLabel="Save Registration" wide>
          {dupWarning && <div style={{ marginBottom:14, background:"#fef9c3", border:"1px solid #fde68a", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#a16207", fontWeight:600 }}>{dupWarning.msg}</div>}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
            <div><label>Timestamp (Auto)</label><input type="text" value={form.timestamp} readOnly /></div>
            <div><label>Date</label><input type="date" value={form.date} onChange={F("date")} /></div>
            <div><label>Time</label><input type="time" value={form.time} onChange={F("time")} /></div>
            <div><label>MR No (Manual) *</label><input type="text" placeholder="Enter MR Number" value={form.mrNo} onChange={F("mrNo")} onBlur={T("mrNo")} style={{ ...vStyle(form.mrNo, v => v.trim().length > 0, touch.mrNo), fontWeight: 700 }} />{vMsg(form.mrNo, v => v.trim().length > 0, touch.mrNo, "Required.")}</div>
            <div><label>Patient ID (Auto Generated)</label><input type="text" value={form.patientId} readOnly style={{ fontWeight: 700 }} /></div>
            <div><label>Visit Type</label><select value={form.visitType} onChange={F("visitType")}>{["New Patient","2nd Visit","3rd Visit","4th Visit","5th Visit","Review","Camp"].map(v => <option key={v}>{v}</option>)}</select></div>
            <div style={{ gridColumn:"1/-1" }}><label>Name *</label><input type="text" value={form.name} onChange={F("name")} onBlur={T("name")} style={vStyle(form.name, v => v.trim().length > 0, touch.name)} />{vMsg(form.name, v => v.trim().length > 0, touch.name, "Required.")}</div>
            <div><label>Phone * (10 digits)</label><input type="text" maxLength={10} value={form.phone} onChange={F("phone")} onBlur={handlePhoneBlur} style={vStyle(form.phone, validate.phone, touch.phone)} />{vMsg(form.phone, validate.phone, touch.phone, "10 digits, not starting 0.")}</div>
            <div><label>Gender</label><select value={form.gender || ""} onChange={F("gender")}><option value="">— Select —</option><option>Male</option><option>Female</option><option>Other</option></select></div>
            <div><label>Age</label><input type="number" min="0" placeholder="Age" value={form.age || ""} onChange={F("age")} /></div>
            <div><label>Designation</label><input type="text" placeholder="Designation" value={form.designation || ""} onChange={F("designation")} /></div>
            <div><label>Aadhar No</label><input type="text" maxLength={12} placeholder="12-digit Aadhar" value={form.aadharNo || ""} onChange={F("aadharNo")} /></div>
            <div style={{ gridColumn:"span 2" }}><label>Address *</label><input type="text" value={form.address} onChange={F("address")} onBlur={T("address")} style={vStyle(form.address, v => v.trim().length > 0, touch.address)} />{vMsg(form.address, v => v.trim().length > 0, touch.address, "Required.")}</div>
            <div><label>Ref / Camp {form.visitType === "Camp" ? "*" : ""}</label><input type="text" placeholder={form.visitType === "Camp" ? "Camp name (required)" : "Camp name or referrer"} value={form.ref} onChange={F("ref")} style={form.visitType === "Camp" && !form.ref ? { borderColor: "#dc2626" } : {}} /></div>
            <div><label>Payment Amount (₹)</label><input type="number" value={form.paymentAmount} onChange={F("paymentAmount")} /></div>
            <div><label>Payment Mode</label><select value={form.paymentMode} onChange={F("paymentMode")}>{["Cash","UPI","Card","Cheque","Free","Camp"].map(m => <option key={m}>{m}</option>)}</select></div>
            {(form.paymentMode === "UPI" || form.paymentMode === "Card" || form.paymentMode === "Cheque") && (<div><label>Payment Ref No</label><input type="text" placeholder="Transaction / Cheque No" value={form.paymentRefNo} onChange={F("paymentRefNo")} /></div>)}
            {isOwner && (<div><label>Branch</label><select value={form.branch} onChange={F("branch")}>{["KKD_Main Branch"].map(b => <option key={b}>{b}</option>)}</select></div>)}
            <div style={{ gridColumn:"1/-1" }}><label>Remarks</label><textarea rows={2} value={form.remarks} onChange={F("remarks")} placeholder="Any remarks…" /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PatientBillSection({ session, data, mutate, can, audit, onSync, syncing, highlightToday }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "KKD_Main Branch";
  const rows    = safeArray(data.patientBill).filter(x => (isOwner || x.branch === branch));

  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({});
  const [touch, setTouch] = useState({});
  const [tab,   setTab]   = useState("basic");
  const [msg,   setMsg]   = useState("");
  const [search,setSearch]= useState("");
  const [filterField, setFilterField] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const FS_FIELDS = [
    { key:"date", label:"Date" }, { key:"timestamp", label:"Date/Time" }, { key:"mrNo", label:"MR No" }, { key:"patientId", label:"Patient ID" },
    { key:"name", label:"Name" }, { key:"phone", label:"Phone" }, { key:"gender", label:"Gender" }, { key:"age", label:"Age" },
    { key:"complaint", label:"Complaint" }, { key:"optom", label:"Optom" }, { key:"branch", label:"Branch" },
  ];
  const [mrLookup, setMrLookup] = useState("");

  const lookupPatient = (query) => {
    if (!query.trim()) return;
    const q = query.toLowerCase();
    const found = safeArray(data.patients).find(p => p.mrNo?.toLowerCase() === q || p.patientId?.toLowerCase() === q || p.phone === query);
    if (found) {
      // Pull most recent existing K Sheet for this patient (if any) so optometrist's saved data is preserved
      const priorSheets = safeArray(data.patientBill).map(unpackKSheetRow).filter(k =>
        (found.mrNo && k.mrNo?.toLowerCase() === found.mrNo.toLowerCase()) ||
        (found.patientId && k.patientId?.toLowerCase() === found.patientId.toLowerCase()) ||
        (found.phone && k.phone === found.phone)
      );
      const prior = priorSheets.sort((a,b) => (b.timestamp||"").localeCompare(a.timestamp||""))[0];
      setForm(f => {
        const base = { ...f, mrNo: found.mrNo || f.mrNo, patientId: found.patientId || f.patientId, name: found.name, phone: found.phone, address: found.address || found.town || "" };
        if (!prior) return base;
        // Merge prior K Sheet fields (skip identifiers/timestamps and internal/meta keys)
        const skip = new Set(["id","timestamp","date","time","by","branch","status","createdBy","createdByName","createdAt","_lookup"]);
        const merged = { ...prior, ...base };
        Object.keys(prior).forEach(k => {
          if (skip.has(k)) return;
          if (base[k] === "" || base[k] === undefined || base[k] === null) {
            merged[k] = prior[k];
          }
        });
        return merged;
      });
      setMrLookup(`✓ Found: ${found.name} (${found.patientId})${prior ? " — prior K Sheet loaded" : ""}`);
    } else { setMrLookup("No match found in OP Registration."); }
  };

  const blank = () => ({
    timestamp: ts(), date: todayStr(), time: timeStr(), mrNo: "", patientId: "", name: "", phone: "", address: "", gender: "Male", age: "", complaint: "", pastHistory: "",
    htn:"", htnRx:"", dm:"", dmRx:"", cad:"", cadRx:"", asthmatic:"", asthmaticRx:"", allergies:"", allergiesRx:"", others:"", othersRx:"",
    pgOd:"", pgOdAdd:"", pgOs:"", pgOsAdd:"", vaOd:"", odCpgp:"", odPh:"", odNv:"", odPgp:"", vaOs:"", osCpgp:"", osPh:"", osPv:"", osPgp:"", retinoscopyOd:"", retinoscopyOs:"",
    reSpherAR:"", reCylAR:"", reAxisAR:"", leSpherAR:"", leCylAR:"", leAxisAR:"", reSpherSub:"", reCylSub:"", reAxisSub:"", leSpherSub:"", leCylSub:"", leAxisSub:"", add:"",
    iop:"", bp:"", ducts:"", rbs:"", dilatedWith:"", dilatedContinuee:"", optom:"",
    eyelids:"", conjunctiva:"", cornea:"", anteriorChamber:"", iris:"", pupil:"", lens:"", ocularMovements:"", fundus:"", advice:"", ophthalmologist:"",
  });

  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const T = k => () => setTouch(t => ({ ...t, [k]: true }));

  const rxField = (label, key, validator, msg2) => (
    <div key={key}><label>{label}</label><input type="number" step="0.25" value={form[key]||""} onChange={F(key)} onBlur={T(key)} style={vStyle(form[key], validator, touch[key])} />{vMsg(form[key], validator, touch[key], msg2)}</div>
  );

  const submit = () => {
    if (form.id) {
      const updated = { ...form, updatedBy: session.id, updatedByName: session.name, updatedAt: ts() };
      mutate("patientBill", arr => arr.map(x => x.id === form.id ? updated : x), updated);
      audit("EDIT",{type:"patientBill",name:form.name,id:form.id});
      setModal(false); setMsg("K Sheet updated.");
      return;
    }
    const record = { id: uid(), branch: isOwner ? "KKD_Main Branch" : branch, ...form, status: "approved", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("patientBill", arr => [...arr, record], record); 
    audit("ADD",{type:"patientBill",name:form.name}); 
    setModal(false); setMsg("K Sheet saved successfully. Full optom details are packed for lookup sync.");
  };

  const openEdit = (row) => { const u = unpackKSheetRow({ ...row }); u.date = toISODate(u.date) || todayStr(); setForm(u); setTouch({}); setMsg(""); setTab("basic"); setMrLookup(""); setModal(true); };
  const [viewRow, setViewRow] = useState(null);
  const openView = (row) => setViewRow(unpackKSheetRow({ ...row }));

  const canEdit = isOwner || can("patientBill","edit");
  const canView = isOwner || can("patientBill","view");

  const del = id => { if (confirm("Delete K Sheet?")) { mutate("patientBill", arr => arr.filter(x => x.id!==id), null, id); audit("DELETE",{type:"patientBill",id}); } };

  // ── Designation-based tab access control ─────────────────────────────
  // Owner / MD / DEVELOPER / OPTOMOLOGIST → all 5 clinical tabs
  // OPTOM → tabs 1–4 (no eye exam / MD tab)
  // FRONT DESK STAFF → tab 1 only (patient info)
  const ALL_TABS = [
    { id:"basic",  label:"1. Patient Info" },
    { id:"vitals", label:"2. History & Vitals (Optom)" },
    { id:"acuity", label:"3. Acuity & Retinoscopy" },
    { id:"ar",     label:"4. AR & Subjective" },
    { id:"eye",    label:"5. Eye Exam (MD)" },
  ];
  const desig = session.designation || "";
  const TABS = (session.role === "owner" || desig === "MD" || desig === "DEVELOPER" || desig === "OPTOMOLOGIST")
    ? ALL_TABS
    : desig === "OPTOM"
      ? ALL_TABS.filter(t => t.id !== "eye")
      : ALL_TABS.filter(t => t.id === "basic"); // FRONT DESK STAFF → patient info only
  const filtered = sortRows(rows.filter(r => matchSearch(r, search, FS_FIELDS, filterField) && inDateRange(r, dateFrom, dateTo)), sortKey, sortDir);

  const KS_CSV_HEADERS = [
    "date","time","mrNo","patientId","name","phone","address","gender","age","complaint","pastHistory",
    "iop","bp","ducts","rbs","dilatedWith","dilatedContinuee","optom",
    "vaOd","vaOs","retinoscopyOd","retinoscopyOs",
    "reSpherAR","reCylAR","reAxisAR","leSpherAR","leCylAR","leAxisAR",
    "reSpherSub","reCylSub","reAxisSub","leSpherSub","leCylSub","leAxisSub","add",
    "eyelids","conjunctiva","cornea","anteriorChamber","iris","pupil","lens","ocularMovements","fundus","advice","ophthalmologist",
    "branch",
  ];
  const handleImport = () => {
    if (!can("patientBill","add") && !isOwner) { setMsg("No permission to import."); return; }
    importCSVFile(records => {
      if (!records.length) { setMsg("CSV is empty."); return; }
      let added = 0, skipped = 0;
      const newRecords = [];
      for (const r of records) {
        const name = String(r.name||"").trim();
        const mrNo = String(r.mrNo||"").trim();
        if (!name || !mrNo) { skipped++; continue; }
        const rec = packKSheetForLegacyTable({
          id: uid(),
          timestamp: ts(), date: r.date || todayStr(), time: r.time || timeStr(),
          gender: r.gender || "Male",
          ...r,
          name, mrNo,
          branch: r.branch || (isOwner ? "KKD_Main Branch" : branch),
          status: "approved",
          createdBy: session.id, createdByName: session.name, createdAt: ts(),
        });
        delete rec._lookup;
        newRecords.push(rec);
        added++;
      }
      if (newRecords.length) mutate("patientBill", arr => [...arr, ...newRecords]);
      audit("IMPORT_CSV", { type:"patientBill", added, skipped });
      setMsg(`Imported ${added} K Sheet(s). Skipped ${skipped} (missing name or MR No).`);
    });
  };

  return (
    <div>
      <SectionHeader
        title="K Sheet Entry"
        onSync={onSync}
        syncing={syncing}
        onTemplate={() => downloadCSVTemplate(KS_CSV_HEADERS, "k_sheet_template.csv")}
        onImport={(can("patientBill","add") || isOwner) ? handleImport : null}
        onExport={() => exportCSV(rows.map(({id,...r})=>r), "k_sheet.csv")}
        onAdd={can("patientBill","add") ? () => { setForm(blank()); setTouch({}); setMsg(""); setTab("basic"); setMrLookup(""); setModal(true); } : null}
        msg={msg}
      />

      <FilterSortBar search={search} setSearch={setSearch} placeholder="🔍 Search by name, phone, MR No, Patient ID…" fields={FS_FIELDS} filterField={filterField} setFilterField={setFilterField} sortKey={sortKey} setSortKey={setSortKey} sortDir={sortDir} setSortDir={setSortDir} dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} />
      <div className="card" style={{ overflowX:"auto" }}>
        <table>
          <thead><tr><th>Date</th><th>MR No</th><th>Patient ID</th><th>Name</th><th>Phone</th><th>Gender</th><th>Age</th><th>Complaint</th><th>IOP</th><th>Optom</th><th>By</th><th>Branch</th><th>Actions</th></tr></thead>
          <tbody>{filtered.map(r => (
            <tr key={r.id} style={highlightToday && isTodayDate(r.date) ? { background:"#fef9c3" } : undefined}>
              <td style={{ fontSize:12, color:"#6b5e52", whiteSpace:"nowrap" }}>{r.date || r.timestamp}</td>
              <td style={{ fontWeight:700, fontFamily:"monospace" }}>{r.mrNo}</td>
              <td style={{ fontFamily:"monospace", color:"#1d4ed8", cursor: canView?"pointer":"default", textDecoration: canView?"underline":"none" }} onClick={()=>canView && openView(r)}>{r.patientId || "—"}</td>
              <td style={{ fontWeight:600, cursor: canView?"pointer":"default" }} onClick={()=>canView && openView(r)}>{r.name}</td><td>{r.phone}</td><td>{r.gender}</td><td>{r.age}</td>
              <td style={{ maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.complaint || "—"}</td>
              <td style={{ fontFamily:"monospace", fontSize:12 }}>{r.iop || "—"}</td>
              <td style={{ fontSize:12, color:"#9b8e82" }}>{r.optom || "—"}</td>
              <td style={{ fontSize:11, color:"#9b8e82" }}>{r.createdByName||"—"}</td>
              <td><span className="tag" style={{ background:"#f0ede8", color:"#6b5e52" }}>{r.branch}</span></td>
              <td><div style={{ display:"flex", gap:6 }}>
                <button className="btn btn-outline btn-sm" disabled={!canView} style={!canView?{opacity:.35,cursor:"not-allowed"}:{}} onClick={()=>canView && openView(r)}>View</button>
                <button className="btn btn-outline btn-sm" disabled={!canEdit} style={!canEdit?{opacity:.35,cursor:"not-allowed"}:{}} onClick={()=>canEdit && openEdit(r)}>Edit</button>
                {isOwner && <button className="btn btn-danger btn-sm" onClick={()=>del(r.id)}>✕</button>}
              </div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {modal && (
        <Modal title="K Sheet Entry" onClose={()=>setModal(false)} onSave={submit} saveLabel="Save K Sheet" xl>
          <div style={{ display:"flex", gap:6, marginBottom:18, flexWrap:"wrap" }}>{TABS.map(t => <button key={t.id} className={`btn btn-sm ${tab===t.id?"btn-dark":"btn-outline"}`} onClick={()=>setTab(t.id)}>{t.label}</button>)}</div>
          
          {tab==="basic" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
              <div style={{ gridColumn:"1/-1", background:"#f0ede8", borderRadius:10, padding:"12px 14px" }}><label style={{ fontWeight:700 }}>🔗 Link to OP Registration</label><div style={{ display:"flex", gap:8, marginTop:6 }}><input type="text" placeholder="Enter MR-001 or PT-0001 or phone…" value={form._lookup||""} onChange={e=>setForm(f=>({...f,_lookup:e.target.value}))} style={{ flex:1 }} /><button className="btn btn-dark btn-sm" onClick={()=>lookupPatient(form._lookup||"")}>Look Up</button></div>{mrLookup && <div style={{ fontSize:12, marginTop:6, color: mrLookup.startsWith("✓")?"#16a34a":"#dc2626" }}>{mrLookup}</div>}</div>
              <div><label>MR No (Read Only)</label><input type="text" value={form.mrNo} readOnly style={{ fontWeight: 700 }} /></div>
              <div><label>Patient ID (Read Only)</label><input type="text" value={form.patientId} readOnly style={{ fontWeight: 700 }} /></div>
              <div><label>Timestamp (Auto)</label><input type="text" value={form.timestamp} readOnly /></div>
              <div><label>Date</label><input type="date" value={form.date} onChange={F("date")} /></div>
              <div><label>Time</label><input type="time" value={form.time} onChange={F("time")} /></div>
              <div style={{ gridColumn:"span 3" }}></div>
              <div style={{ gridColumn:"span 2" }}><label>Name *</label><input type="text" value={form.name} onChange={F("name")} style={vStyle(form.name, v=>v.trim().length>0, touch.name)} onBlur={T("name")} /></div>
              <div><label>Phone *</label><input type="text" maxLength={10} value={form.phone} onChange={F("phone")} style={vStyle(form.phone, validate.phone, touch.phone)} onBlur={T("phone")} /></div>
              <div style={{ gridColumn:"1/-1" }}><label>Address</label><input type="text" value={form.address} onChange={F("address")} /></div>
              <div><label>Gender</label><select value={form.gender} onChange={F("gender")}><option>Male</option><option>Female</option><option>Other</option></select></div>
              <div><label>Age</label><input type="number" value={form.age} onChange={F("age")} /></div>
            </div>
          )}

          {tab==="vitals" && (
            <div style={{ display:"grid", gap:14 }}>
              <div style={{ gridColumn:"1/-1" }}><label>Complaint</label><textarea rows={2} value={form.complaint} onChange={F("complaint")} /></div>
              <div style={{ gridColumn:"1/-1" }}><label>Past History</label><textarea rows={2} value={form.pastHistory} onChange={F("pastHistory")} /></div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, background:"#f0ede8", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>Medical History & Rx</div>
                <div><label>HTN</label><input type="text" value={form.htn} onChange={F("htn")} /></div><div><label>Rx</label><input type="text" value={form.htnRx} onChange={F("htnRx")} /></div>
                <div><label>DM</label><input type="text" value={form.dm} onChange={F("dm")} /></div><div><label>Rx</label><input type="text" value={form.dmRx} onChange={F("dmRx")} /></div>
                <div><label>CAD</label><input type="text" value={form.cad} onChange={F("cad")} /></div><div><label>Rx</label><input type="text" value={form.cadRx} onChange={F("cadRx")} /></div>
                <div><label>Asthmatic</label><input type="text" value={form.asthmatic} onChange={F("asthmatic")} /></div><div><label>Rx</label><input type="text" value={form.asthmaticRx} onChange={F("asthmaticRx")} /></div>
                <div><label>Allergies To</label><input type="text" value={form.allergies} onChange={F("allergies")} /></div><div><label>Rx</label><input type="text" value={form.allergiesRx} onChange={F("allergiesRx")} /></div>
                <div><label>Others</label><input type="text" value={form.others} onChange={F("others")} /></div><div><label>Rx</label><input type="text" value={form.othersRx} onChange={F("othersRx")} /></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, background:"#f0ede8", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>Vitals & Dilation</div>
                <div><label>IOP</label><input type="text" value={form.iop} onChange={F("iop")} /></div><div><label>BP</label><input type="text" value={form.bp} onChange={F("bp")} /></div>
                <div><label>Ducts</label><input type="text" value={form.ducts} onChange={F("ducts")} /></div><div><label>RBS</label><input type="text" value={form.rbs} onChange={F("rbs")} /></div>
                <div style={{ gridColumn:"span 2" }}><label>Dilated with (D/T/H/C)</label><input type="text" value={form.dilatedWith} onChange={F("dilatedWith")} /></div>
                <div style={{ gridColumn:"span 2" }}><label>Dilated Continuee</label><input type="text" value={form.dilatedContinuee} onChange={F("dilatedContinuee")} /></div>
                <div style={{ gridColumn:"span 2" }}><label>Optom Name</label><input type="text" value={form.optom} onChange={F("optom")} /></div>
              </div>
            </div>
          )}

          {tab==="acuity" && (
            <div style={{ display:"grid", gap:14 }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, background:"#f0ede8", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>PG</div>
                <div><label>PG.OD</label><input type="text" value={form.pgOd} onChange={F("pgOd")} /></div><div><label>Add+</label><input type="text" value={form.pgOdAdd} onChange={F("pgOdAdd")} /></div>
                <div><label>OS</label><input type="text" value={form.pgOs} onChange={F("pgOs")} /></div><div><label>Add</label><input type="text" value={form.pgOsAdd} onChange={F("pgOsAdd")} /></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, background:"#f0ede8", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>Visual Acuity OD</div>
                <div><label>VA OD</label><input type="text" value={form.vaOd} onChange={F("vaOd")} /></div><div><label>OD cPGP</label><input type="text" value={form.odCpgp} onChange={F("odCpgp")} /></div>
                <div><label>OD PH</label><input type="text" value={form.odPh} onChange={F("odPh")} /></div><div><label>OD NV</label><input type="text" value={form.odNv} onChange={F("odNv")} /></div><div><label>OD PGP-</label><input type="text" value={form.odPgp} onChange={F("odPgp")} /></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, background:"#f0ede8", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>Visual Acuity OS</div>
                <div><label>VA OS</label><input type="text" value={form.vaOs} onChange={F("vaOs")} /></div><div><label>OS cPGP</label><input type="text" value={form.osCpgp} onChange={F("osCpgp")} /></div>
                <div><label>OS PH</label><input type="text" value={form.osPh} onChange={F("osPh")} /></div><div><label>OS PV / NV</label><input type="text" value={form.osPv} onChange={F("osPv")} /></div><div><label>OS PGP-</label><input type="text" value={form.osPgp} onChange={F("osPgp")} /></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div><label>Retinoscopy OD</label><input type="text" value={form.retinoscopyOd} onChange={F("retinoscopyOd")} /></div><div><label>Retinoscopy OS</label><input type="text" value={form.retinoscopyOs} onChange={F("retinoscopyOs")} /></div>
              </div>
            </div>
          )}

          {tab==="ar" && (
            <div style={{ display:"grid", gap:14 }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, background:"#f0ede8", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>Right Eye (RE) — AR</div>
                {rxField("Spherical","reSpherAR",validate.sphereCyl,"-6 to +6, steps 0.25")}{rxField("Cylinder","reCylAR",validate.sphereCyl,"-6 to +6, steps 0.25")}{rxField("Axis","reAxisAR",validate.axis,"0–180")}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, background:"#f0ede8", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>Left Eye (LE) — AR</div>
                {rxField("Spherical","leSpherAR",validate.sphereCyl,"-6 to +6, steps 0.25")}{rxField("Cylinder","leCylAR",validate.sphereCyl,"-6 to +6, steps 0.25")}{rxField("Axis","leAxisAR",validate.axis,"0–180")}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, background:"#f0ede8", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>Right Eye (RE) — Subjective</div>
                {rxField("Spherical","reSpherSub",validate.sphereCyl,"-6 to +6")}{rxField("Cylinder","reCylSub",validate.sphereCyl,"-6 to +6")}{rxField("Axis","reAxisSub",validate.axis,"0–180")}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, background:"#f0ede8", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>Left Eye (LE) — Subjective</div>
                {rxField("Spherical","leSpherSub",validate.sphereCyl,"-6 to +6")}{rxField("Cylinder","leCylSub",validate.sphereCyl,"-6 to +6")}{rxField("Axis","leAxisSub",validate.axis,"0–180")}
              </div>
              <div style={{ maxWidth:220 }}>
                <label>ADD (Subjective)</label><input type="number" step="0.25" value={form.add||""} onChange={F("add")} onBlur={T("add")} style={vStyle(form.add,v=>!v||validate.add(v),touch.add)} />{vMsg(form.add,v=>!v||validate.add(v),touch.add,"0 or 0.75–3.00 in steps 0.25")}
              </div>
            </div>
          )}

          {tab==="eye" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
              <div style={{ gridColumn:"1/-1", fontWeight:700, fontSize:11, color:"#9b8e82", textTransform:"uppercase" }}>Eye Examination (Ophthalmologist)</div>
              {["eyelids","conjunctiva","cornea","anteriorChamber","iris","pupil","lens","ocularMovements","fundus"].map(k => (
                <div key={k}><label>{k.replace(/([A-Z])/g," $1").replace(/^./,s=>s.toUpperCase())}</label><input type="text" value={form[k]||""} onChange={F(k)} /></div>
              ))}
              <div style={{ gridColumn:"1/-1" }}><label>Advice</label><textarea rows={2} value={form.advice} onChange={F("advice")} /></div>
              <div style={{ gridColumn:"span 2" }}><label>Ophthalmologist Name</label><input type="text" value={form.ophthalmologist} onChange={F("ophthalmologist")} /></div>
            </div>
          )}
        </Modal>
      )}
      {viewRow && (
        <Modal title={`K Sheet · ${viewRow.name || viewRow.mrNo || ""}`} onClose={()=>setViewRow(null)} onSave={()=>setViewRow(null)} saveLabel="Close" xl>
          <PatientFullView patient={viewRow} kSheet={viewRow} />
        </Modal>
      )}
    </div>
  );
}

function OptometristSection({ session, data, mutate, can, audit, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "KKD_Main Branch";
  const rows    = safeArray(data.optometrist).filter(x => (isOwner || x.branch === branch));

  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({});
  const [msg,   setMsg]   = useState("");
  const [mrLookup, setMrLookup] = useState("");
  const [search, setSearch] = useState("");
  const [filterField, setFilterField] = useState("");
  const [sortKey, setSortKey] = useState("timestamp");
  const [sortDir, setSortDir] = useState("desc");
  const FS_FIELDS = [
    { key:"timestamp", label:"Date/Time" }, { key:"mrNo", label:"MR No" }, { key:"patientId", label:"Patient ID" },
    { key:"name", label:"Name" }, { key:"phone", label:"Phone" }, { key:"complaint", label:"Complaint" },
    { key:"optomName", label:"Optometrist" }, { key:"branch", label:"Branch" },
  ];

  const blank = () => ({ timestamp: ts(), date: todayStr(), time: timeStr(), mrNo:"", patientId:"", name:"", phone:"", complaint:"", pastHistory:"", optomName: session.name });
  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const lookupPatient = (query) => {
    const found = safeArray(data.patients).find(p => p.mrNo?.toLowerCase() === query.toLowerCase() || p.patientId?.toLowerCase() === query.toLowerCase() || p.phone === query);
    if (found) {
      const ksheet = safeArray(data.patientBill).find(b => b.mrNo === found.mrNo || b.patientId === found.patientId);
      setForm(f => ({ ...f, mrNo: found.mrNo || "", patientId: found.patientId || "", name: found.name, phone: found.phone, complaint: ksheet?.complaint || f.complaint, pastHistory: ksheet?.pastHistory || f.pastHistory }));
      setMrLookup(`✓ Found: ${found.name} (${found.patientId})`);
    } else { setMrLookup("No match found."); }
  };

  const submit = () => {
    if (!form.name.trim()) { setMsg("Patient name required."); return; }
    const record = { id: uid(), branch: isOwner ? "KKD_Main Branch" : branch, ...form, status: "approved", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("optometrist", arr=>[...arr, record], record); setModal(false); setMsg("Saved.");
  };

  const del = id => { if (confirm("Delete?")) { mutate("optometrist", arr=>arr.filter(x=>x.id!==id), null, id); audit("DELETE",{type:"optometrist",id}); } };
  const filtered = sortRows(rows.filter(r => matchSearch(r, search, FS_FIELDS, filterField)), sortKey, sortDir);

  return (
    <div>
      <SectionHeader title="Optometrist" onSync={onSync} syncing={syncing} onExport={() => exportCSV(rows.map(({id,...r})=>r),"optometrist.csv")} onAdd={can("optometrist","add") ? () => { setForm(blank()); setMsg(""); setMrLookup(""); setModal(true); } : null} msg={msg} />
      <FilterSortBar search={search} setSearch={setSearch} placeholder="🔍 Search by name, MR No, Patient ID…" fields={FS_FIELDS} filterField={filterField} setFilterField={setFilterField} sortKey={sortKey} setSortKey={setSortKey} sortDir={sortDir} setSortDir={setSortDir} />
      <div className="card" style={{ overflowX:"auto" }}>
        <table>
          <thead><tr><th>Timestamp</th><th>MR No</th><th>Patient ID</th><th>Name</th><th>Phone</th><th>Complaint</th><th>Past History</th><th>Optometrist</th><th>Branch</th>{isOwner&&<th></th>}</tr></thead>
          <tbody>{filtered.map(r => (
            <tr key={r.id}>
              <td style={{ fontSize:11,color:"#9b8e82",whiteSpace:"nowrap" }}>{r.timestamp}</td><td style={{ fontWeight:700,fontFamily:"monospace" }}>{r.mrNo||"—"}</td>
              <td style={{ fontFamily:"monospace",color:"#1d4ed8" }}>{r.patientId||"—"}</td><td style={{ fontWeight:600 }}>{r.name}</td><td>{r.phone}</td>
              <td style={{ maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.complaint||"—"}</td><td style={{ maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.pastHistory||"—"}</td>
              <td style={{ fontSize:12,color:"#9b8e82" }}>{r.optomName||"—"}</td><td><span className="tag" style={{ background:"#f0ede8",color:"#6b5e52" }}>{r.branch}</span></td>
              {isOwner && <td><button className="btn btn-danger btn-sm" onClick={()=>del(r.id)}>✕</button></td>}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {modal && (
        <Modal title="Optometrist Entry" onClose={()=>setModal(false)} onSave={submit} saveLabel="Save">
          <div style={{ background:"#f0ede8", borderRadius:10, padding:"12px 14px", marginBottom:14 }}><label style={{ fontWeight:700 }}>🔗 Look Up Patient</label><div style={{ display:"flex", gap:8, marginTop:6 }}><input type="text" placeholder="Enter MR-001 or PT-0001 or phone…" value={form._lookup||""} onChange={e=>setForm(f=>({...f,_lookup:e.target.value}))} style={{ flex:1 }} /><button className="btn btn-dark btn-sm" onClick={()=>lookupPatient(form._lookup||"")}>Look Up</button></div>{mrLookup && <div style={{ fontSize:12,marginTop:6,color:mrLookup.startsWith("✓")?"#16a34a":"#dc2626" }}>{mrLookup}</div>}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div><label>MR No</label><input type="text" value={form.mrNo} onChange={F("mrNo")} /></div><div><label>Patient ID</label><input type="text" value={form.patientId} onChange={F("patientId")} /></div>
            <div><label>Name *</label><input type="text" value={form.name} onChange={F("name")} /></div><div><label>Phone</label><input type="text" maxLength={10} value={form.phone} onChange={F("phone")} /></div>
            <div style={{ gridColumn:"1/-1" }}><label>Complaint</label><textarea rows={3} value={form.complaint} onChange={F("complaint")} /></div>
            <div style={{ gridColumn:"1/-1" }}><label>Past History</label><textarea rows={3} value={form.pastHistory} onChange={F("pastHistory")} /></div>
            <div style={{ gridColumn:"1/-1" }}><label>Optometrist Name</label><input type="text" value={form.optomName} onChange={F("optomName")} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function OpticalsSection({ session, data, mutate, can, audit, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "KKD_Main Branch";
  const rows    = safeArray(data.opticals).filter(x => (isOwner || x.branch === branch));

  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState({});
  const [msg,      setMsg]      = useState("");
  const [rxPreview,setRxPreview]= useState(null);
  const [mrLookup, setMrLookup] = useState("");
  const [search,   setSearch]   = useState("");
  const [filterField, setFilterField] = useState("");
  const [sortKey, setSortKey] = useState("timestamp");
  const [sortDir, setSortDir] = useState("desc");
  const FS_FIELDS = [
    { key:"timestamp", label:"Date/Time" }, { key:"billNo", label:"Bill No" }, { key:"mrNo", label:"MR No" }, { key:"patientId", label:"Patient ID" },
    { key:"name", label:"Name" }, { key:"phone", label:"Phone" }, { key:"lensType", label:"Lens Type" }, { key:"frameNo", label:"Frame No" },
    { key:"totalPrice", label:"Total Price" }, { key:"discount", label:"Discount" }, { key:"advance", label:"Advance" }, { key:"balance", label:"Balance" },
    { key:"deliveryStatus", label:"Delivery" }, { key:"optomName", label:"Rep" }, { key:"branch", label:"Branch" },
  ];

  const blank = () => ({ timestamp: ts(), date: todayStr(), time: timeStr(), mrNo:"", patientId:"", name:"", phone:"", address:"", billNo:`OPT-${(rows.length||0)+1}/${new Date().getFullYear()}`, lensType:"Single Vision", frameNo:"", totalPrice:"", discount:"", advance:"", advancePaymentMethod:"Cash", transactionId:"", balance:"", deliveryStatus:"Not Ready", optomName: session.name });
  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const lookupPatient = (query) => {
    if (!query.trim()) return;
    const foundOp = safeArray(data.patients).find(p => p.mrNo?.toLowerCase() === query.toLowerCase() || p.patientId?.toLowerCase() === query.toLowerCase() || p.phone === query);
    if (!foundOp) { setMrLookup("No patient found."); return; }
    const ksheet = safeArray(data.patientBill).find(b => b.mrNo === foundOp.mrNo || b.patientId === foundOp.patientId);
    setForm(f => ({ ...f, mrNo: foundOp.mrNo || "", patientId: foundOp.patientId || "", name: foundOp.name, phone: foundOp.phone, address: foundOp.address || "" }));
    if (ksheet) {
      setRxPreview({ RE: `${ksheet.reSpherSub||"—"} / ${ksheet.reCylSub||"—"} × ${ksheet.reAxisSub||"—"}`, LE: `${ksheet.leSpherSub||"—"} / ${ksheet.leCylSub||"—"} × ${ksheet.leAxisSub||"—"}`, ADD: ksheet.add || "—", lensType: ksheet.lensType || "—", frameNo: ksheet.frameNo || "—" });
      setMrLookup(`✓ Found: ${foundOp.name} (${foundOp.patientId}) — K Sheet loaded`);
    } else { setRxPreview(null); setMrLookup(`✓ Found: ${foundOp.name} — No K Sheet found yet`); }
  };

  const calcBalance = () => { setForm(f => ({ ...f, balance: String(Math.max(0, (parseFloat(f.totalPrice)||0) - (parseFloat(f.discount)||0) - (parseFloat(f.advance)||0))) })); };

  const submit = () => {
    if (!form.name || !form.name.trim()) { setMsg("Patient name required."); return; }
    if ((form.advancePaymentMethod === "Card" || form.advancePaymentMethod === "UPI") && !String(form.transactionId || "").trim()) { setMsg("Payment Ref No is required for Card / UPI payments."); return; }
    if (form.id) {
      const updated = { ...form, updatedBy: session.id, updatedByName: session.name, updatedAt: ts() };
      mutate("opticals", arr => arr.map(x => x.id === form.id ? updated : x), updated);
      audit("EDIT",{type:"opticals",name:form.name,id:form.id});
      setModal(false); setMsg("Opticals updated.");
      return;
    }
    const record = { id: uid(), branch: isOwner ? "KKD_Main Branch" : branch, ...form, status: "approved", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("opticals", arr=>[...arr, record], record); setModal(false); setMsg("Opticals saved.");
  };

  const openEdit = (row) => { setForm({ ...row }); setRxPreview(null); setMrLookup(""); setMsg(""); setModal(true); };
  const canEdit = isOwner || can("opticals","edit");

  const del = id => { if (confirm("Delete?")) { mutate("opticals", arr=>arr.filter(x=>x.id!==id), null, id); audit("DELETE",{type:"opticals",id}); } };
  const filtered = sortRows(rows.filter(r => matchSearch(r, search, FS_FIELDS, filterField)), sortKey, sortDir);

  const OPT_CSV_HEADERS = ["date","time","billNo","mrNo","patientId","name","phone","address","lensType","frameNo","totalPrice","discount","advance","advancePaymentMethod","transactionId","balance","deliveryStatus","optomName","branch"];
  const handleImport = () => {
    if (!can("opticals","add") && !isOwner) { setMsg("No permission to import."); return; }
    importCSVFile(records => {
      if (!records.length) { setMsg("CSV is empty."); return; }
      let added = 0, skipped = 0;
      const newRecords = [];
      for (const r of records) {
        const name = String(r.name||"").trim();
        if (!name) { skipped++; continue; }
        const totalPrice = r.totalPrice || "";
        const discount = r.discount || "";
        const advance = r.advance || "";
        const balance = r.balance || String(Math.max(0, (parseFloat(totalPrice)||0) - (parseFloat(discount)||0) - (parseFloat(advance)||0)));
        newRecords.push({
          id: uid(),
          timestamp: ts(), date: r.date || todayStr(), time: r.time || timeStr(),
          billNo: r.billNo || "",
          mrNo: r.mrNo || "", patientId: r.patientId || "", name, phone: r.phone || "", address: r.address || "",
          lensType: r.lensType || "Single Vision", frameNo: r.frameNo || "",
          totalPrice, discount, advance, advancePaymentMethod: r.advancePaymentMethod || "Cash",
          transactionId: r.transactionId || "", balance,
          deliveryStatus: r.deliveryStatus || "Not Ready",
          optomName: r.optomName || session.name,
          branch: r.branch || (isOwner ? "KKD_Main Branch" : branch),
          status: "approved",
          createdBy: session.id, createdByName: session.name, createdAt: ts(),
        });
        added++;
      }
      if (newRecords.length) mutate("opticals", arr => [...arr, ...newRecords]);
      audit("IMPORT_CSV", { type:"opticals", added, skipped });
      setMsg(`Imported ${added} opticals record(s). Skipped ${skipped} (missing name).`);
    });
  };


  return (
    <div>
      <SectionHeader title="Opticals" onSync={onSync} syncing={syncing} onTemplate={() => downloadCSVTemplate(OPT_CSV_HEADERS, "opticals_template.csv")} onImport={(can("opticals","add") || isOwner) ? handleImport : null} onExport={() => exportCSV(rows.map(({id,...r})=>r),"opticals.csv")} onAdd={can("opticals","add") ? () => { setForm(blank()); setMsg(""); setRxPreview(null); setMrLookup(""); setModal(true); } : null} msg={msg} />
      <FilterSortBar search={search} setSearch={setSearch} placeholder="🔍 Search by name, MR No, Patient ID…" fields={FS_FIELDS} filterField={filterField} setFilterField={setFilterField} sortKey={sortKey} setSortKey={setSortKey} sortDir={sortDir} setSortDir={setSortDir} />
      <div className="card" style={{ overflowX:"auto" }}>
        <table>
          <thead><tr>
            <th>Timestamp</th><th>Bill No</th><th>MR No</th><th>Patient ID</th><th>Name</th><th>Phone</th>
            <th>Lens Type</th><th>Frame No</th><th>Total Price</th><th>Discount</th><th>Net Payable</th><th>Advance</th><th>Balance</th>
            <th>Delivery</th><th>Adv. Method</th><th>Payment Ref No</th><th>Rep</th><th>Branch</th><th>Actions</th>
          </tr></thead>
          <tbody>{filtered.map(r => (
            <tr key={r.id}>
              <td style={{ fontSize:11,color:"#9b8e82",whiteSpace:"nowrap" }}>{r.timestamp}</td><td style={{ fontWeight:700,fontFamily:"monospace",color:"#1d4ed8" }}>{r.billNo||"—"}</td><td style={{ fontWeight:700,fontFamily:"monospace" }}>{r.mrNo||"—"}</td>
              <td style={{ fontFamily:"monospace",color:"#1d4ed8" }}>{r.patientId||"—"}</td><td style={{ fontWeight:600 }}>{r.name}</td><td>{r.phone}</td>
              <td><span className="tag tag-blue" style={{ fontSize:10 }}>{r.lensType||"—"}</span></td>
              <td style={{ fontFamily:"monospace", fontSize:12 }}>{r.frameNo||"—"}</td>
              <td style={{ fontWeight:700 }}>{r.totalPrice?`₹${r.totalPrice}`:"—"}</td><td>{r.discount?`₹${r.discount}`:"—"}</td>
              <td style={{ fontWeight:700 }}>{r.totalPrice?`₹${Math.max(0,(parseFloat(r.totalPrice)||0)-(parseFloat(r.discount)||0))}`:"—"}</td>
              <td>{r.advance?`₹${r.advance}`:"—"}</td>
              <td style={{ fontWeight:700,color:parseFloat(r.balance)>0?"#dc2626":"#16a34a" }}>{r.balance?`₹${r.balance}`:"—"}</td>
              <td><span className={`tag ${r.deliveryStatus==="Delivered"?"tag-green":r.deliveryStatus==="Not Ready"?"tag-red":"tag-yellow"}`} style={{ fontSize:10 }}>{r.deliveryStatus==="Fixing Completed But Not Delivered"?"Fixing Done":(r.deliveryStatus||"—")}</span></td>
              <td><span className="tag tag-blue">{r.advancePaymentMethod||"—"}</span></td><td style={{ fontSize:11,fontFamily:"monospace",color:"#9b8e82" }}>{r.transactionId||"—"}</td>
              <td style={{ fontSize:11,color:"#9b8e82" }}>{r.optomName||"—"}</td><td><span className="tag" style={{ background:"#f0ede8",color:"#6b5e52" }}>{r.branch}</span></td>
              <td><div style={{ display:"flex", gap:6 }}>
                <button className="btn btn-outline btn-sm" disabled={!canEdit} style={!canEdit?{opacity:.35,cursor:"not-allowed"}:{}} onClick={()=>canEdit && openEdit(r)}>Edit</button>
                {isOwner && <button className="btn btn-danger btn-sm" onClick={()=>del(r.id)}>✕</button>}
              </div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {modal && (
        <Modal title="Opticals Entry" onClose={()=>setModal(false)} onSave={submit} saveLabel="Save Entry" wide>
          <div style={{ background:"#f0ede8", borderRadius:10, padding:"12px 14px", marginBottom:14 }}><label style={{ fontWeight:700 }}>🔗 Link to Patient</label><div style={{ display:"flex", gap:8, marginTop:6 }}><input type="text" placeholder="Enter MR-001 or PT-0001 or phone…" value={form._lookup||""} onChange={e=>setForm(f=>({...f,_lookup:e.target.value}))} style={{ flex:1 }} /><button className="btn btn-dark btn-sm" onClick={()=>lookupPatient(form._lookup||"")}>Look Up & Fill</button></div>{mrLookup && <div style={{ fontSize:12,marginTop:6,color:mrLookup.startsWith("✓")?"#16a34a":"#dc2626" }}>{mrLookup}</div>}</div>
          {rxPreview && (<div style={{ background:"#e0f2fe",borderRadius:10,padding:"12px 16px",marginBottom:14,fontSize:13 }}><div style={{ fontWeight:700,marginBottom:8,color:"#0369a1" }}>📋 Prescription from K Sheet</div><div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, fontFamily:"monospace" }}><div><span style={{ color:"#9b8e82",fontSize:11 }}>RE</span><br/>{rxPreview.RE}</div><div><span style={{ color:"#9b8e82",fontSize:11 }}>LE</span><br/>{rxPreview.LE}</div><div><span style={{ color:"#9b8e82",fontSize:11 }}>ADD</span><br/>{rxPreview.ADD}</div><div><span style={{ color:"#9b8e82",fontSize:11 }}>Lens Type</span><br/>{rxPreview.lensType}</div><div><span style={{ color:"#9b8e82",fontSize:11 }}>Frame No</span><br/>{rxPreview.frameNo}</div></div></div>)}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
            <div><label>MR No</label><input type="text" value={form.mrNo} onChange={F("mrNo")} /></div><div><label>Patient ID</label><input type="text" value={form.patientId} onChange={F("patientId")} /></div><div><label>Bill No</label><input type="text" placeholder="e.g. OPT-1/2026" value={form.billNo} onChange={F("billNo")} /></div>
            <div style={{ gridColumn:"span 2" }}><label>Name</label><input type="text" value={form.name} onChange={F("name")} /></div><div><label>Phone</label><input type="text" maxLength={10} value={form.phone} onChange={F("phone")} /></div>
            <div style={{ gridColumn:"1/-1" }}><label>Address</label><input type="text" value={form.address} onChange={F("address")} /></div>
            <div style={{ gridColumn:"span 2" }}><label>Lens Type</label><select value={form.lensType} onChange={F("lensType")}>{LENS_TYPES.map(l=><option key={l}>{l}</option>)}</select></div>
            <div><label>Frame No</label><input type="text" placeholder="e.g. FR-A12" value={form.frameNo} onChange={F("frameNo")} /></div>
            <div style={{ gridColumn:"1/-1", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
              <div><label>Total Price (₹) *</label><input type="number" value={form.totalPrice} onChange={F("totalPrice")} onBlur={calcBalance} /></div>
              <div><label>Discount (₹)</label><input type="number" value={form.discount} onChange={F("discount")} onBlur={calcBalance} /></div>
              <div><label>Advance (₹)</label><input type="number" value={form.advance} onChange={F("advance")} onBlur={calcBalance} /></div>
              <div><label>Balance (₹)</label><input type="number" value={form.balance} readOnly style={{ background:"#f0ede8" }} /></div>
            </div>
            <div><label>Advance Payment Method</label><select value={form.advancePaymentMethod} onChange={F("advancePaymentMethod")}>{["Cash","UPI","Card","Cheque","NA"].map(m=><option key={m}>{m}</option>)}</select></div>
            {(form.advancePaymentMethod==="UPI"||form.advancePaymentMethod==="Card"||form.advancePaymentMethod==="Cheque") && (<div><label>Payment Ref No{(form.advancePaymentMethod==="UPI"||form.advancePaymentMethod==="Card")?" *":""}</label><input type="text" placeholder="Transaction / Cheque No" value={form.transactionId} onChange={F("transactionId")} /></div>)}
            <div style={{ gridColumn:"1/-1" }}><label>Delivery Status</label><select value={form.deliveryStatus} onChange={F("deliveryStatus")}>{DELIVERY_STATUS.map(d=><option key={d}>{d}</option>)}</select></div>
            <div><label>Representative Name</label><input type="text" value={form.optomName} onChange={F("optomName")} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Opticals Status: lookup from Opticals, update delivery status, auto-remind ──
function OpticalsStatusSection({ session, data, mutate, can, audit, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "KKD_Main Branch";
  const rows    = safeArray(data.opticals).filter(x => (isOwner || x.branch === branch));

  const [search, setSearch] = useState("");
  const [filterField, setFilterField] = useState("");
  const [sortKey, setSortKey] = useState("timestamp");
  const [sortDir, setSortDir] = useState("desc");
  const FS_FIELDS = [
    { key:"timestamp", label:"Date/Time" }, { key:"billNo", label:"Bill No" }, { key:"mrNo", label:"MR No" }, { key:"patientId", label:"Patient ID" },
    { key:"name", label:"Name" }, { key:"phone", label:"Phone" }, { key:"totalPrice", label:"Total" }, { key:"discount", label:"Discount" }, { key:"advance", label:"Advance" },
    { key:"advancePaymentMethod", label:"Payment Method" }, { key:"balance", label:"Balance" }, { key:"deliveryStatus", label:"Delivery Status" }, { key:"optomName", label:"Rep" },
  ];
  const [msg,    setMsg]    = useState("");
  const [refEdits, setRefEdits] = useState({});

  const canEdit = isOwner || can("opticals", "edit") || can("opticals", "add");

  const balanceOf = (r) => {
    const b = r.balance !== "" && r.balance != null ? parseFloat(r.balance) : (parseFloat(r.totalPrice) || 0) - (parseFloat(r.discount) || 0) - (parseFloat(r.advance) || 0);
    return Math.max(0, isNaN(b) ? 0 : b);
  };

  // Selling cost after discount (Net Payable) — what the patient actually owes for the order before advance/balance.
  const netPayable = (r) => Math.max(0, (parseFloat(r.totalPrice) || 0) - (parseFloat(r.discount) || 0));

  // K Sheet lookup — pulls the patient's subjective refraction (RE / LE / ADD) recorded by the optometrist,
  // matched by MR No, Patient ID, or phone, so front desk / opticals staff can see the Rx without opening K Sheet.
  const kSheetSub = (r) => {
    const k = safeArray(data.patientBill).map(unpackKSheetRow).find(b =>
      (r.mrNo && b.mrNo === r.mrNo) || (r.patientId && b.patientId === r.patientId) || (r.phone && b.phone === r.phone)
    );
    if (!k) return null;
    return {
      RE: `${k.reSpherSub || "—"}/${k.reCylSub || "—"}×${k.reAxisSub || "—"}`,
      LE: `${k.leSpherSub || "—"}/${k.leCylSub || "—"}×${k.leAxisSub || "—"}`,
      ADD: k.add || "—",
    };
  };

  const commitRef = (row) => {
    const val = (refEdits[row.id] ?? (row.transactionId || "")).trim();
    if ((row.advancePaymentMethod === "Card" || row.advancePaymentMethod === "UPI") && !val) {
      setMsg(`Payment Ref No is required for ${row.advancePaymentMethod} payment (${row.name}).`);
    }
    if (val === (row.transactionId || "")) return;
    const updated = { ...row, transactionId: val, updatedBy: session.id, updatedByName: session.name, updatedAt: ts() };
    mutate("opticals", arr => arr.map(x => x.id === row.id ? updated : x), updated);
    audit("EDIT", { type: "opticals", name: row.name, id: row.id });
  };

  const changeDelivery = (row, newStatus) => {
    if (!canEdit) { setMsg("No permission to update delivery status."); return; }
    const updated = { ...row, deliveryStatus: newStatus, updatedBy: session.id, updatedByName: session.name, updatedAt: ts() };
    mutate("opticals", arr => arr.map(x => x.id === row.id ? updated : x), updated);
    audit("EDIT", { type: "opticals", name: row.name, id: row.id });

    if (newStatus === "Fixing Completed But Not Delivered") {
      const exists = safeArray(data.reminders).some(rm => rm.sourceOpticalId === row.id && rm.status === "pending");
      if (!exists) {
        const rem = {
          id: uid(),
          mrNo: row.mrNo || "", patientId: row.patientId || "", name: row.name || "", phone: row.phone || "",
          reminderType: "Follow-up Visit",
          reminderDate: todayStr(), reminderTime: "18:00",
          notes: "Auto: Fixing completed but not delivered — Front Desk to call patient and arrange delivery.",
          branch: row.branch || branch,
          targetDesignation: "FRONT DESK STAFF",
          sourceOpticalId: row.id,
          status: "pending",
          createdBy: session.id, createdByName: session.name, createdAt: ts(),
        };
        mutate("reminders", arr => [...arr, rem], rem);
        audit("REMINDER_ADD", { name: row.name, type: "Front Desk Follow-up Call" });
        setMsg(`🔔 Reminder created for Front Desk Staff to follow up with ${row.name || "patient"}.`);
      } else {
        setMsg(`Front Desk follow-up reminder already pending for ${row.name || "patient"}.`);
      }
    }
  };

  const filtered = sortRows(rows.filter(r => matchSearch(r, search, FS_FIELDS, filterField)), sortKey, sortDir);

  return (
    <div>
      <SectionHeader title="Opticals Status" onSync={onSync} syncing={syncing} onExport={() => exportCSV(filtered.map(r => ({ billNo:r.billNo, mrNo:r.mrNo, patientId:r.patientId, name:r.name, phone:r.phone, totalPrice:r.totalPrice, discount:r.discount, netPayable:netPayable(r), advance:r.advance, balance:balanceOf(r), deliveryStatus:r.deliveryStatus, optomName:r.optomName })), "opticals_status.csv")} msg={msg} />
      <FilterSortBar search={search} setSearch={setSearch} placeholder="🔍 Search by name, MR No, Patient ID, phone, bill no…" fields={FS_FIELDS} filterField={filterField} setFilterField={setFilterField} sortKey={sortKey} setSortKey={setSortKey} sortDir={sortDir} setSortDir={setSortDir} />
      <div className="card" style={{ overflowX:"auto" }}>
        <table>
          <thead><tr>
            <th>Bill No</th><th>MR No</th><th>Patient ID</th><th>Name</th><th>Phone</th>
            <th>Total</th><th>Discount</th><th>Net Payable</th><th>Advance</th><th>Payment Method</th><th>Balance Payment</th><th>Payment Ref No</th><th>Delivery Status</th><th>K Sheet Rx (Subjective)</th><th>Rep</th>
          </tr></thead>
          <tbody>{filtered.map(r => {
            const bal = balanceOf(r);
            const needRef = r.advancePaymentMethod === "Card" || r.advancePaymentMethod === "UPI";
            const sub = kSheetSub(r);
            return (
              <tr key={r.id}>
                <td style={{ fontWeight:700, fontFamily:"monospace", color:"#1d4ed8" }}>{r.billNo||"—"}</td>
                <td style={{ fontWeight:700, fontFamily:"monospace" }}>{r.mrNo||"—"}</td>
                <td style={{ fontFamily:"monospace", color:"#1d4ed8" }}>{r.patientId||"—"}</td>
                <td style={{ fontWeight:600 }}>{r.name}</td><td>{r.phone||"—"}</td>
                <td style={{ fontWeight:700 }}>{r.totalPrice?`₹${r.totalPrice}`:"—"}</td>
                <td>{r.discount?`₹${r.discount}`:"—"}</td>
                <td style={{ fontWeight:700 }}>{r.totalPrice?`₹${netPayable(r)}`:"—"}</td>
                <td>{r.advance?`₹${r.advance}`:"—"}</td>
                <td><span className="tag tag-blue">{r.advancePaymentMethod||"—"}</span></td>
                <td style={{ fontWeight:700, color: bal>0?"#dc2626":"#16a34a" }}>{bal>0?`₹${bal}`:"Fully Paid"}</td>
                <td>
                  <input
                    type="text"
                    placeholder={needRef ? "Required" : "—"}
                    value={refEdits[r.id] ?? (r.transactionId || "")}
                    onChange={e => setRefEdits(s => ({ ...s, [r.id]: e.target.value }))}
                    onBlur={() => commitRef(r)}
                    disabled={!canEdit}
                    style={{ width:130, padding:"5px 8px", fontSize:11, fontFamily:"monospace", border: needRef && !(refEdits[r.id] ?? r.transactionId) ? "1.5px solid #dc2626" : "1.5px solid #e2ddd8", borderRadius:7 }}
                  />
                </td>
                <td>
                  <select
                    value={r.deliveryStatus || "Not Ready"}
                    onChange={e => changeDelivery(r, e.target.value)}
                    disabled={!canEdit}
                    style={{ width:200, padding:"5px 8px", fontSize:11, borderRadius:7, border:"1.5px solid #e2ddd8", background: r.deliveryStatus==="Delivered" ? "#dcfce7" : r.deliveryStatus==="Fixing Completed But Not Delivered" ? "#fef9c3" : "#fee2e2" }}
                  >{DELIVERY_STATUS.map(d => <option key={d} value={d}>{d}</option>)}</select>
                </td>
                <td style={{ fontSize:11, fontFamily:"monospace", whiteSpace:"nowrap" }}>
                  {sub ? (<><div>RE {sub.RE}</div><div>LE {sub.LE}</div><div>ADD {sub.ADD}</div></>) : <span style={{ color:"#9b8e82" }}>No K Sheet</span>}
                </td>
                <td style={{ fontSize:11, color:"#9b8e82" }}>{r.optomName||"—"}</td>
              </tr>
            );
          })}</tbody>
        </table>
        {filtered.length === 0 && <div style={{ color:"#9b8e82", fontSize:13, padding:20, textAlign:"center" }}>No opticals records found.</div>}
      </div>
    </div>
  );
}

// ── Lens Sale: bill for lens sold against an opticals order ──
function LensSaleSection({ session, data, mutate, can, audit, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "KKD_Main Branch";
  const rows    = safeArray(data.lensSale).filter(x => (isOwner || x.branch === branch));
  const lensStock = safeArray(data.stock).filter(s => s.category === "Lenses" && (isOwner || s.branch === branch));

  const [modal, setModal] = useState(false);
  const [msg, setMsg] = useState("");
  const blankLine = () => ({ id: uid(), code:"", name:"", unit:"PCS", dia:"", eye:"RE", sph:"", cyl:"", axis:"", addPwr:"", qty:1, price:0, disPct:0 });
  const blank = () => ({
    billSeries:"SALE-L", billNo: `${(rows.length||0)+1}/${new Date().getFullYear()}`,
    date: todayStr(), billType:"INCLUSIVE GST(L)", godown:"MC 1", bookedBy: session.name,
    partyAC:"CASH", address:"", contactNo:"", stateCode:"CG",
    mrNo:"", patientId:"",
    items:[blankLine()], remarks:"", deliveryDate: todayStr(),
  });
  const [form, setForm] = useState(blank());

  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const updLine = (i, k, v) => setForm(f => ({ ...f, items: f.items.map((l,idx) => idx===i ? { ...l, [k]: v } : l) }));
  const addLine = () => setForm(f => ({ ...f, items: [...f.items, blankLine()] }));
  const delLine = (i) => setForm(f => ({ ...f, items: f.items.filter((_,idx) => idx!==i) }));

  const poRows = safeArray(data.purchaseOrders).filter(p => p.category === "Lenses" && (isOwner || p.branch === branch));
  const pickLens = (i, sku) => {
    const s = lensStock.find(x => x.sku === sku); if (!s) return;
    const po = [...poRows].reverse().find(p => p.sku === sku) || {};
    updLine(i, "code", s.sku);
    setForm(f => ({ ...f, items: f.items.map((l,idx) => idx===i ? { ...l, code:s.sku, name:s.name, sph:po.sph||"", cyl:po.cyl||"", axis:po.axis||"", addPwr:po.addPwr||"", price: Number(po.sellingPrice||0) } : l) }));
  };

  const lookupPatient = () => {
    const q = (form._lookup||"").trim(); if (!q) return;
    const p = safeArray(data.patients).find(p => p.mrNo?.toLowerCase()===q.toLowerCase() || p.patientId?.toLowerCase()===q.toLowerCase() || p.phone===q);
    if (!p) { setMsg("No patient found."); return; }
    setForm(f => ({ ...f, mrNo:p.mrNo||"", patientId:p.patientId||"", partyAC:p.name, address:p.address||"", contactNo:p.phone||"" }));
    setMsg(`✓ Loaded ${p.name}`);
  };

  const lineTotal = l => Math.max(0, (Number(l.qty)||0) * (Number(l.price)||0) * (1 - (Number(l.disPct)||0)/100));
  const grandTotal = form.items.reduce((s,l) => s + lineTotal(l), 0);
  const taxable = form.billType?.includes("INCLUSIVE") ? grandTotal/1.12 : grandTotal;

  const submit = () => {
    if (!form.partyAC?.trim()) { setMsg("Party A/C required."); return; }
    if (!form.items.some(l => l.name)) { setMsg("Add at least one lens line."); return; }
    const record = { id: uid(), branch: isOwner ? "KKD_Main Branch" : branch, ...form, grandTotal, taxable, createdBy: session.id, createdByName: session.name, createdAt: ts(), timestamp: ts() };
    mutate("lensSale", arr => [...arr, record], record);
    audit("ADD", { type:"lensSale", billNo: record.billNo });
    setModal(false); setMsg("Lens Sale saved.");
  };

  return (
    <div>
      <SectionHeader title="Lens Sale" onSync={onSync} syncing={syncing} onExport={() => exportCSV(rows.map(({id,items,...r})=>({...r, items: JSON.stringify(items)})),"lens_sale.csv")} onAdd={can("opticals","add") ? () => { setForm(blank()); setMsg(""); setModal(true); } : null} msg={msg} />
      <div className="card" style={{ overflowX:"auto" }}>
        <table>
          <thead><tr><th>Bill No</th><th>Date</th><th>Party</th><th>MR No</th><th>Items</th><th>Total ₹</th><th>By</th><th>Branch</th></tr></thead>
          <tbody>{rows.map(r => (
            <tr key={r.id}>
              <td style={{ fontFamily:"monospace", fontWeight:700, color:"#1d4ed8" }}>{r.billSeries} · {r.billNo}</td>
              <td>{r.date}</td><td style={{ fontWeight:600 }}>{r.partyAC}</td>
              <td style={{ fontFamily:"monospace" }}>{r.mrNo||"—"}</td>
              <td style={{ fontSize:12 }}>{safeArray(r.items).map(i => `${i.name}(${i.eye} ${i.sph||""}/${i.cyl||""}×${i.axis||""})`).join(", ")}</td>
              <td style={{ fontWeight:700, color:"#166534" }}>{currency(r.grandTotal)}</td>
              <td style={{ fontSize:11, color:"#9b8e82" }}>{r.createdByName||"—"}</td>
              <td><span className="tag" style={{ background:"#f0ede8", color:"#6b5e52" }}>{r.branch}</span></td>
            </tr>
          ))}</tbody>
        </table>
        {rows.length===0 && <div style={{ color:"#9b8e82", fontSize:13, padding:20, textAlign:"center" }}>No lens sale bills yet.</div>}
      </div>
      {modal && (
        <Modal title="Lens Sale Entry" onClose={()=>setModal(false)} onSave={submit} saveLabel="Save Bill" wide>
          <div style={{ background:"linear-gradient(90deg,#1d4ed8,#3b82f6)", color:"#fff", padding:"10px 14px", borderRadius:10, marginBottom:14, fontWeight:700 }}>Lens Sale</div>

          <div style={{ background:"#f0ede8", borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
            <label style={{ fontWeight:700 }}>🔗 Link to Patient (MR / Patient ID / Phone)</label>
            <div style={{ display:"flex", gap:8, marginTop:6 }}>
              <input type="text" value={form._lookup||""} onChange={e=>setForm(f=>({...f,_lookup:e.target.value}))} placeholder="MR-001 / PT-0001 / phone" style={{ flex:1 }} />
              <button className="btn btn-dark btn-sm" onClick={lookupPatient}>Look Up & Fill</button>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:14 }}>
            <div><label>Bill Series</label><input type="text" value={form.billSeries} onChange={F("billSeries")} /></div>
            <div><label>Bill No</label><input type="text" value={form.billNo} onChange={F("billNo")} /></div>
            <div><label>Date</label><input type="date" value={form.date} onChange={F("date")} /></div>
            <div><label>Bill Type</label><select value={form.billType} onChange={F("billType")}>{["INCLUSIVE GST(L)","EXCLUSIVE GST(L)","NON-GST"].map(t=><option key={t}>{t}</option>)}</select></div>
            <div><label>Godown</label><input type="text" value={form.godown} onChange={F("godown")} /></div>
            <div><label>Booked By</label><input type="text" value={form.bookedBy} onChange={F("bookedBy")} /></div>
            <div><label>Party A/C</label><input type="text" value={form.partyAC} onChange={F("partyAC")} /></div>
            <div style={{ gridColumn:"span 2" }}><label>Address</label><input type="text" value={form.address} onChange={F("address")} /></div>
            <div><label>Contact No</label><input type="text" value={form.contactNo} onChange={F("contactNo")} /></div>
            <div><label>State Code</label><input type="text" value={form.stateCode} onChange={F("stateCode")} /></div>
            <div><label>MR No</label><input type="text" value={form.mrNo} onChange={F("mrNo")} /></div>
          </div>

          <div style={{ fontWeight:700, marginBottom:6, color:"#1d4ed8" }}>Particular (PO Lens lookup → Lens Location)</div>
          <div style={{ overflowX:"auto", border:"1px solid #e8e2db", borderRadius:10 }}>
            <table style={{ fontSize:12 }}>
              <thead style={{ background:"#fafafa" }}><tr>
                <th>SN</th><th>Code · Location</th><th>Item Name</th><th>Unit</th><th>DIA</th><th>Eye</th><th>SPH</th><th>CYL</th><th>Axis</th><th>Add</th><th>Qty</th><th>Price</th><th>Dis%</th><th>Dis Amt</th><th>Total</th><th></th>
              </tr></thead>
              <tbody>{form.items.map((l,i) => {
                const lt = lineTotal(l); const dis = (Number(l.qty)||0)*(Number(l.price)||0)*((Number(l.disPct)||0)/100);
                return (<tr key={l.id}>
                  <td>{i+1}</td>
                  <td><select value={l.code} onChange={e=>pickLens(i,e.target.value)} style={{ minWidth:160, padding:"4px" }}><option value="">—</option>{lensStock.map(s=><option key={s.sku} value={s.sku}>{s.sku} {s.location?`· 📍${s.location}`:""}{s.boxNo?` · Box ${s.boxNo}`:""}</option>)}</select></td>
                  <td><input type="text" value={l.name} onChange={e=>updLine(i,"name",e.target.value)} style={{ minWidth:140 }} /></td>
                  <td><input type="text" value={l.unit} onChange={e=>updLine(i,"unit",e.target.value)} style={{ width:60 }} /></td>
                  <td><input type="text" value={l.dia} onChange={e=>updLine(i,"dia",e.target.value)} style={{ width:50 }} /></td>
                  <td><select value={l.eye} onChange={e=>updLine(i,"eye",e.target.value)} style={{ width:60 }}>{["RE","LE","RL","BE"].map(x=><option key={x}>{x}</option>)}</select></td>
                  <td><input type="text" value={l.sph} onChange={e=>updLine(i,"sph",e.target.value)} style={{ width:55 }} /></td>
                  <td><input type="text" value={l.cyl} onChange={e=>updLine(i,"cyl",e.target.value)} style={{ width:55 }} /></td>
                  <td><input type="text" value={l.axis} onChange={e=>updLine(i,"axis",e.target.value)} style={{ width:55 }} /></td>
                  <td><input type="text" value={l.addPwr} onChange={e=>updLine(i,"addPwr",e.target.value)} style={{ width:55 }} /></td>
                  <td><input type="number" value={l.qty} onChange={e=>updLine(i,"qty",e.target.value)} style={{ width:55 }} /></td>
                  <td><input type="number" value={l.price} onChange={e=>updLine(i,"price",e.target.value)} style={{ width:75 }} /></td>
                  <td><input type="number" value={l.disPct} onChange={e=>updLine(i,"disPct",e.target.value)} style={{ width:55 }} /></td>
                  <td style={{ fontFamily:"monospace" }}>{dis.toFixed(2)}</td>
                  <td style={{ fontFamily:"monospace", fontWeight:700, color:"#166534" }}>{lt.toFixed(2)}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={()=>delLine(i)}>✕</button></td>
                </tr>);
              })}</tbody>
            </table>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:10 }}>
            <button className="btn btn-outline btn-sm" onClick={addLine}>+ Add Line</button>
            <div style={{ display:"flex", gap:18, fontWeight:700 }}>
              <div>Taxable: <span style={{ color:"#1d4ed8" }}>{currency(taxable)}</span></div>
              <div>Gross: <span style={{ color:"#166534" }}>{currency(grandTotal)}</span></div>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:14, marginTop:14 }}>
            <div><label>Remarks</label><input type="text" value={form.remarks} onChange={F("remarks")} /></div>
            <div><label>Del. Date</label><input type="date" value={form.deliveryDate} onChange={F("deliveryDate")} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Purchase Orders: record incoming stock from logistics or local market ──
function PurchaseOrderSection({ session, data, mutate, can, audit, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "KKD_Main Branch";
  const rows    = safeArray(data.purchaseOrders).filter(x => isOwner || x.branch === branch);
  const FRAME_TYPES = ["Full Rim", "Half Rim", "Rimless", "Sports", "Kids"];
  const ACCESSORY_TYPES = ["Spects Box", "Cloths", "Lens Cleaner Spray"];
  const CATS = ["Lenses", "Frames", "Accessories"];
  const CAT_COLORS = { Frames: { bg:"#dbeafe", color:"#1d4ed8" }, Lenses: { bg:"#dcfce7", color:"#166534" }, Accessories: { bg:"#fef3c7", color:"#92400e" } };

  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [msg, setMsg] = useState("");

  const blank = () => ({
    poNo: `PO-${(rows.length||0)+1}/${new Date().getFullYear()}`,
    date: todayStr(),
    category: "Lenses",
    sku: "",
    name: "",
    trackingNo: "",        // tracking/LR no, or "LM" for local market
    logisticsName: "",     // required if not LM
    partyAC: "",           // wholesale / retail party / LM shop name
    sph: "", cyl: "", axis: "", addPwr: "", lensType: "Single Vision",
    frameType: "Full Rim", color: "",
    accessoryType: "Spects Box",
    poPrice: 0, sellingPrice: 0,
    qty: 1,
    location: "", boxNo: "",
    remarks: "",
  });
  const [form, setForm] = useState(blank());
  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const open = (r) => { setForm(r ? { ...blank(), ...r } : blank()); setMsg(""); setModal(r ? r : "add"); };

  const validate = () => {
    const req = (v) => v !== "" && v !== null && v !== undefined;
    if (!req(form.poNo)) return "PO No required.";
    if (!req(form.date)) return "Date required.";
    if (!req(form.trackingNo)) return "Tracking / LR No required (use 'LM' for local market).";
    const isLM = String(form.trackingNo).trim().toUpperCase() === "LM";
    if (!isLM && !req(form.logisticsName)) return "Logistics name required when not local market.";
    if (!req(form.partyAC)) return "Party A/C (shop / wholesale / retail) required.";
    if (!req(form.sku)) return "SKU required.";
    if (!req(form.name)) return "Item name required.";
    if (Number(form.qty) <= 0) return "Quantity must be > 0.";
    if (Number(form.poPrice) < 0 || Number(form.sellingPrice) < 0) return "Prices must be ≥ 0.";
    if (form.category === "Lenses") {
      if (!req(form.sph) || !req(form.cyl) || !req(form.axis) || !req(form.addPwr) || !req(form.lensType)) return "Lens fields (SPH/CYL/Axis/Add/Lens Type) all required.";
    }
    if (form.category === "Frames") {
      if (!req(form.frameType) || !req(form.color)) return "Frame type and colour required.";
    }
    if (form.category === "Accessories") {
      if (!req(form.accessoryType)) return "Accessory type required.";
    }
    return "";
  };

  // PO auto-creates or updates a stock row (by SKU+branch)
  const upsertStock = (rec) => {
    mutate("stock", arr => {
      const i = arr.findIndex(s => s.sku === rec.sku && s.branch === rec.branch);
      if (i === -1) {
        return [...arr, {
          id: uid(), sku: rec.sku, name: rec.name, category: rec.category, brand: rec.brand || "",
          qty: Number(rec.qty), reorder: 5, location: rec.location || "", boxNo: rec.boxNo || "",
          branch: rec.branch, createdBy: session.id, createdByName: session.name,
        }];
      }
      const ex = arr[i];
      const next = { ...ex, qty: Number(ex.qty || 0) + Number(rec.qty), location: rec.location || ex.location, boxNo: rec.boxNo || ex.boxNo };
      return [...arr.slice(0, i), next, ...arr.slice(i+1)];
    });
  };

  const save = () => {
    const err = validate();
    if (err) { setMsg(err); return; }
    const rec = {
      id: modal === "add" ? uid() : modal.id,
      ...form,
      qty: Number(form.qty), poPrice: Number(form.poPrice), sellingPrice: Number(form.sellingPrice),
      branch: isOwner ? (form.branch || "KKD_Main Branch") : branch,
      createdBy: session.id, createdByName: session.name, createdAt: ts(),
    };
    if (modal === "add") {
      mutate("purchaseOrders", arr => [...arr, rec], rec);
      audit("ADD", { type: "purchaseOrders", poNo: rec.poNo, sku: rec.sku });
      upsertStock(rec);
    } else {
      mutate("purchaseOrders", arr => arr.map(x => x.id === rec.id ? rec : x), rec);
      audit("EDIT", { type: "purchaseOrders", id: rec.id });
    }
    setModal(null);
    setMsg("Purchase Order saved.");
  };

  const catTag = (c) => { const s = CAT_COLORS[c] || { bg:"#f0ede8", color:"#6b5e52" }; return <span className="tag" style={{ background:s.bg, color:s.color, fontWeight:700 }}>{c}</span>; };
  const detail = (r) => {
    if (r.category === "Lenses") return [r.sph && `SPH ${r.sph}`, r.cyl && `CYL ${r.cyl}`, r.axis && `Ax ${r.axis}`, r.addPwr && `Add ${r.addPwr}`, r.lensType].filter(Boolean).join(" · ");
    if (r.category === "Frames") return [r.frameType, r.color].filter(Boolean).join(" · ");
    if (r.category === "Accessories") return r.accessoryType || "—";
    return "—";
  };
  const filtered = rows.filter(r => (cat === "All" || r.category === cat) && (
    !search || [r.poNo, r.sku, r.name, r.partyAC, r.trackingNo, r.logisticsName].some(v => String(v||"").toLowerCase().includes(search.toLowerCase()))
  ));
  const isLM = String(form.trackingNo).trim().toUpperCase() === "LM";

  return (
    <div>
      <SectionHeader title="Purchase Orders (PO)" onSync={onSync} syncing={syncing} onExport={() => exportCSV(rows.map(({id,...r})=>r), "purchase_orders.csv")} onAdd={can("inventory","add") ? () => open(null) : null} msg={msg} />
      <div className="card" style={{ overflowX:"auto" }}>
        <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
          <input type="text" placeholder="Search PO / SKU / party / tracking…" value={search} onChange={e=>setSearch(e.target.value)} style={{ maxWidth:280 }} />
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {["All", ...CATS].map(c => <button key={c} className={`btn btn-sm ${cat===c?"btn-dark":"btn-outline"}`} onClick={()=>setCat(c)}>{c}</button>)}
          </div>
        </div>
        <table>
          <thead><tr><th>PO No</th><th>Date</th><th>Category</th><th>SKU</th><th>Item</th><th>Detail</th><th>Tracking/LR</th><th>Logistics</th><th>Party A/C</th><th>Qty</th><th>PO ₹</th><th>Sell ₹</th><th>Branch</th>{(can("inventory","edit") || isOwner) && <th></th>}</tr></thead>
          <tbody>{filtered.map(r => (
            <tr key={r.id}>
              <td style={{ fontWeight:700, color:"#1d4ed8", fontFamily:"monospace" }}>{r.poNo}</td>
              <td>{r.date}</td>
              <td>{catTag(r.category)}</td>
              <td style={{ fontFamily:"monospace", fontSize:11 }}>{r.sku}</td>
              <td style={{ fontWeight:600 }}>{r.name}</td>
              <td style={{ fontFamily:"monospace", fontSize:12 }}>{detail(r)}</td>
              <td style={{ fontFamily:"monospace" }}>{r.trackingNo}</td>
              <td>{String(r.trackingNo).trim().toUpperCase() === "LM" ? <span style={{ color:"#9b8e82" }}>— Local —</span> : (r.logisticsName || "—")}</td>
              <td>{r.partyAC}</td>
              <td style={{ fontWeight:700 }}>{r.qty}</td>
              <td style={{ color:"#9b8e82" }}>{currency(r.poPrice)}</td>
              <td style={{ fontWeight:700, color:"#166534" }}>{currency(r.sellingPrice)}</td>
              <td><span className="tag" style={{ background:"#f0ede8", color:"#6b5e52" }}>{r.branch}</span></td>
              {(can("inventory","edit") || isOwner) && (
                <td style={{ display:"flex", gap:5 }}>
                  <button className="btn btn-outline btn-sm" onClick={()=>open(r)}>Edit</button>
                  {isOwner && <button className="btn btn-danger btn-sm" onClick={() => { if (confirm("Delete PO?")) { mutate("purchaseOrders", arr => arr.filter(x => x.id !== r.id), null, r.id); audit("DELETE", { type:"purchaseOrders", id:r.id }); } }}>✕</button>}
                </td>
              )}
            </tr>
          ))}</tbody>
        </table>
        {filtered.length === 0 && <div style={{ color:"#9b8e82", fontSize:13, padding:20, textAlign:"center" }}>No purchase orders yet.</div>}
      </div>

      {modal && (
        <Modal title={modal === "add" ? "New Purchase Order" : "Edit Purchase Order"} onClose={() => setModal(null)} onSave={save} saveLabel="Save PO" wide>
          <div style={{ background:"linear-gradient(90deg,#166534,#16a34a)", color:"#fff", padding:"10px 14px", borderRadius:10, marginBottom:14, fontWeight:700 }}>Purchase Order · {form.category}</div>

          <div className="form-grid">
            <div><label>PO No *</label><input type="text" value={form.poNo} onChange={F("poNo")} /></div>
            <div><label>Date *</label><input type="date" value={form.date} onChange={F("date")} /></div>
            <div><label>Category *</label><select value={form.category} onChange={F("category")}>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>

            <div><label>Tracking / LR No * <span style={{ color:"#9b8e82", fontWeight:400 }}>(enter "LM" for local market)</span></label><input type="text" placeholder="LR-12345 or LM" value={form.trackingNo} onChange={F("trackingNo")} /></div>
            <div><label>Logistics Name {isLM ? <span style={{ color:"#9b8e82", fontWeight:400 }}>(not required for LM)</span> : "*"}</label><input type="text" placeholder="DTDC / BlueDart / …" value={form.logisticsName} onChange={F("logisticsName")} disabled={isLM} /></div>
            <div><label>Party A/C * <span style={{ color:"#9b8e82", fontWeight:400 }}>(LM shop / wholesale / retail)</span></label><input type="text" placeholder="Shop name / wholesaler" value={form.partyAC} onChange={F("partyAC")} /></div>

            <div><label>SKU *</label><input type="text" value={form.sku} onChange={F("sku")} /></div>
            <div className="full"><label>Item Name *</label><input type="text" value={form.name} onChange={F("name")} /></div>

            {form.category === "Lenses" && <>
              <div><label>SPH *</label><input type="text" placeholder="-2.50" value={form.sph} onChange={F("sph")} /></div>
              <div><label>CYL *</label><input type="text" placeholder="-1.00" value={form.cyl} onChange={F("cyl")} /></div>
              <div><label>Axis *</label><input type="text" placeholder="0–180" value={form.axis} onChange={F("axis")} /></div>
              <div><label>Add *</label><input type="text" placeholder="+1.75" value={form.addPwr} onChange={F("addPwr")} /></div>
              <div><label>Lens Type *</label><select value={form.lensType} onChange={F("lensType")}>{LENS_TYPES.map(l => <option key={l}>{l}</option>)}</select></div>
            </>}

            {form.category === "Frames" && <>
              <div><label>Type of Frame *</label><select value={form.frameType} onChange={F("frameType")}>{FRAME_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label>Colour *</label><input type="text" placeholder="Black / Gold" value={form.color} onChange={F("color")} /></div>
            </>}

            {form.category === "Accessories" && <>
              <div><label>Accessory Type *</label><select value={form.accessoryType} onChange={F("accessoryType")}>{ACCESSORY_TYPES.map(a => <option key={a}>{a}</option>)}</select></div>
            </>}

            <div><label>PO Price (₹) *</label><input type="number" value={form.poPrice} onChange={F("poPrice")} /></div>
            <div><label>Selling Price (₹) *</label><input type="number" value={form.sellingPrice} onChange={F("sellingPrice")} /></div>
            <div><label>Quantity *</label><input type="number" min={1} value={form.qty} onChange={F("qty")} /></div>

            <div><label>Location</label><input type="text" placeholder="Shelf / Rack" value={form.location} onChange={F("location")} /></div>
            <div><label>Box No</label><input type="text" placeholder="B-14" value={form.boxNo} onChange={F("boxNo")} /></div>
            <div className="full"><label>Remarks</label><input type="text" value={form.remarks} onChange={F("remarks")} /></div>
          </div>

          {msg && <div style={{ marginTop:10, fontSize:12, color: msg.includes("saved") ? "#16a34a" : "#dc2626", background: msg.includes("saved") ? "#dcfce7" : "#fee2e2", padding:"8px 12px", borderRadius:8 }}>{msg}</div>}
        </Modal>
      )}
    </div>
  );
}


function InventorySection({ session, data, mutate, can, audit, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "KKD_Main Branch";
  const rows    = safeArray(data.stock).filter(x => isOwner || x.branch === branch);
  const [search, setSearch] = useState(""); const [cat, setCat] = useState("All");
  const [filterField, setFilterField] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const FS_FIELDS = [
    { key:"sku", label:"SKU" }, { key:"name", label:"Name" }, { key:"category", label:"Category" }, { key:"brand", label:"Brand" },
    { key:"qty", label:"Qty" }, { key:"boxNo", label:"Box No" },
    { key:"location", label:"Location" }, { key:"branch", label:"Branch" },
  ];
  const [modal,  setModal]  = useState(null); const [msg, setMsg] = useState("");
  const blank = { sku: "", name: "", category: "Frames", brand: "", qty: 0, reorder: 5, location: "", boxNo: "" };
  const [form, setForm] = useState(blank);
  const cats = ["All", "Frames", "Contact Lenses", "Lenses", "Accessories"];
  const FRAME_TYPES = ["Full Rim", "Half Rim", "Rimless", "Sports", "Kids"];
  const ACCESSORY_TYPES = ["Spects Box", "Cloths", "Lens Cleaner Spray"];
  const CAT_COLORS = { Frames: { bg:"#dbeafe", color:"#1d4ed8" }, "Contact Lenses": { bg:"#fae8ff", color:"#86198f" }, Lenses: { bg:"#dcfce7", color:"#166534" }, Accessories: { bg:"#fef3c7", color:"#92400e" } };
  const filtered = sortRows(rows.filter(s => (cat === "All" || s.category === cat) && matchSearch(s, search, FS_FIELDS, filterField)), sortKey, sortDir);
  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  
  const open = s => { setForm(s ? { ...blank, ...s } : { ...blank, branch: isOwner ? "KKD_Main Branch" : branch }); setModal(s || "add"); };
  
  const save = () => {
    const item = { ...form, qty: Number(form.qty), reorder: Number(form.reorder) };
    if (modal === "add") { const rec = { id: uid(), ...item, createdBy: session.id, createdByName: session.name }; mutate("stock", arr => [...arr, rec], rec); audit("ADD", { type: "stock", sku: item.sku }); }
    else { mutate("stock", arr => arr.map(x => x.id === modal.id ? { ...modal, ...item } : x), { ...modal, ...item }); audit("EDIT", { type: "stock", id: modal.id }); }
    setModal(null);
  };
  
  const catTag = (c) => { const s = CAT_COLORS[c] || { bg:"#f0ede8", color:"#6b5e52" }; return <span className="tag" style={{ background:s.bg, color:s.color, fontWeight:700 }}>{c}</span>; };
  const detailText = (s) => {
    const pos = [s.location && `📍${s.location}`, s.boxNo && `Box ${s.boxNo}`].filter(Boolean).join(" · ");
    return pos || "—";
  };
  
  return (
    <div>
      <SectionHeader title="Inventory" onSync={onSync} syncing={syncing} onExport={() => exportCSV(rows.map(({ id, ...r }) => r), "inventory.csv")} onAdd={can("inventory", "add") ? () => open(null) : null} msg={msg} />
      <div className="card" style={{ overflowX: "auto" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 200 }} />
          <select value={filterField} onChange={e => setFilterField(e.target.value)} style={_fsSelStyle} title="Filter by a specific field"><option value="">🔎 All fields</option>{FS_FIELDS.map(f => <option key={f.key} value={f.key}>In: {f.label}</option>)}</select>
          <select value={sortKey} onChange={e => setSortKey(e.target.value)} style={_fsSelStyle} title="Sort by">{FS_FIELDS.map(f => <option key={f.key} value={f.key}>Sort: {f.label}</option>)}</select>
          <button className="btn btn-outline btn-sm" onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")} title="Toggle ascending / descending">{sortDir === "asc" ? "↑ Asc" : "↓ Desc"}</button>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{cats.map(c => <button key={c} className={`btn btn-sm ${cat === c ? "btn-dark" : "btn-outline"}`} onClick={() => setCat(c)}>{c}</button>)}</div>
        </div>
        <table><thead><tr><th>SKU</th><th>Name</th><th>Category</th><th>Brand</th><th>Qty</th><th>Reorder</th><th>Box No</th><th>Location</th><th>Branch</th><th>By</th>{(can("inventory", "edit") || isOwner) && <th></th>}</tr></thead>
          <tbody>{filtered.map(s => (
            <tr key={s.id}>
              <td style={{ fontFamily: "monospace", fontSize: 11 }}>{s.sku}</td><td style={{ fontWeight: 600 }}>{s.name}</td><td>{catTag(s.category)}</td>
              <td>{s.brand || "—"}</td>
              <td><span style={{ fontWeight: 700, color: s.qty <= s.reorder ? "#dc2626" : "#16a34a" }}>{s.qty}</span></td>
              <td style={{ color:"#9b8e82" }}>{s.reorder}</td>
              <td style={{ fontFamily: "monospace", fontSize: 12 }}>{s.boxNo || "—"}</td>
              <td style={{ fontSize: 12, color: "#9b8e82" }}>{s.location || "—"}</td>
              <td><span className="tag" style={{ background: "#f0ede8", color: "#6b5e52" }}>{s.branch}</span></td><td style={{ fontSize: 11, color: "#9b8e82" }}>{s.createdByName || "—"}</td>
              {(can("inventory", "edit") || isOwner) && (<td style={{ display: "flex", gap: 5 }}><button className="btn btn-outline btn-sm" onClick={() => open(s)}>Edit</button>{isOwner && <button className="btn btn-danger btn-sm" onClick={() => { if (confirm("Delete?")) { mutate("stock", arr => arr.filter(x => x.id !== s.id), null, s.id); audit("DELETE", { type: "stock", id: s.id }); } }}>✕</button>}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {modal && (
        <Modal title={modal === "add" ? "Add Stock" : "Edit Stock"} onClose={() => setModal(null)} onSave={save} saveLabel="Save Inventory">
          <div className="form-grid">
            <div><label>SKU</label><input type="text" value={form.sku} onChange={F("sku")} /></div>
            <div><label>Category</label><select value={form.category} onChange={F("category")}>{["Frames", "Contact Lenses", "Lenses", "Accessories"].map(c => <option key={c}>{c}</option>)}</select></div>
            <div className="full"><label>Name</label><input type="text" value={form.name} onChange={F("name")} /></div>
            <div><label>Brand</label><input type="text" value={form.brand} onChange={F("brand")} /></div>
            <div><label>Location</label><input type="text" value={form.location} onChange={F("location")} /></div>
            <div><label>Qty</label><input type="number" value={form.qty} onChange={F("qty")} /></div>
            <div><label>Reorder At</label><input type="number" value={form.reorder} onChange={F("reorder")} /></div>
            <div><label>Box Number</label><input type="text" placeholder="B-14" value={form.boxNo} onChange={F("boxNo")} /></div>
          </div>
          <div style={{ marginTop:14, padding:"10px 14px", background:"#fef3c7", borderRadius:8, fontSize:12, color:"#92400e" }}>
            ℹ Pricing, prescription power (SPH/CYL/Axis/Add), frame type, colour and accessory type are now managed in <b>Purchase Orders</b>.
          </div>
        </Modal>
      )}
    </div>
  );
}

function InvoicesSection({ session, data, mutate, can, audit, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "KKD_Main Branch";
  const rows    = safeArray(data.invoices).filter(x => (isOwner || x.branch === branch));
  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({ patientName: "", date: todayStr(), items: [], discount: 0 });
  const [lN, setLN] = useState(""); const [lQ, setLQ] = useState(1); const [lP, setLP] = useState(0);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [invoiceRow, setInvoiceRow] = useState(null);
  const ALLOWED_STATUSES = new Set(["paid","delivered","booked","pending"]);
  const handleGenerateInvoice = (inv) => {
    const status = String(inv.deliveryStatus || inv.status || "").toLowerCase();
    if (!ALLOWED_STATUSES.has(status)) {
      setMsg(`Cannot generate invoice — status "${status||"unknown"}" must be Booked, Pending, Paid or Delivered.`);
      setTimeout(() => setMsg(""), 4000);
      return;
    }
    setInvoiceRow(inv);
  };
  
  const addLine = () => { if (!lN.trim()) { setErr("Enter an item name before clicking Add."); return; } setErr(""); setForm(f => ({ ...f, items: [...f.items, { name: lN, qty: Number(lQ) || 1, price: Number(lP) || 0 }] })); setLN(""); setLQ(1); setLP(0); };
  const sub = safeArray(form.items).reduce((s, l) => s + l.qty * l.price, 0);
  
  const save = () => {
    const name = String(form.patientName || "").trim();
    if (!name) { setErr("Patient name is required."); return; }
    if (!form.items.length) { setErr("Add at least one item before creating the invoice — type the item name, qty & price, then click \"Add\"."); return; }
    setErr("");
    const record = { id: `INV-${uid().slice(0, 6).toUpperCase()}`, branch: isOwner ? "KKD_Main Branch" : branch, ...form, patientName: name, discount: Number(form.discount) || 0, approvalStatus: "approved", status: "Pending", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("invoices", arr => [...arr, record], record); audit("ADD", { type: "invoices" }); setModal(false);
    setMsg("Invoice created."); setTimeout(() => setMsg(""), 3000);
  };
  const total = inv => safeArray(inv.items).reduce((s, i) => s + i.qty * i.price, 0) - (inv.discount || 0);

  const INV_CSV_HEADERS = ["patientName", "date", "itemName", "qty", "price", "discount"];
  const handleImportInvoices = () => {
    if (!can("invoices", "add") && !isOwner) { setMsg("No permission to import."); return; }
    importCSVFile(records => {
      if (!records.length) { setMsg("CSV is empty."); return; }
      let added = 0, skipped = 0;
      const newRecords = [];
      for (const r of records) {
        const patientName = String(r.patientName || "").trim();
        const itemName = String(r.itemName || "").trim();
        if (!patientName || !itemName) { skipped++; continue; }
        newRecords.push({
          id: `INV-${uid().slice(0, 6).toUpperCase()}`,
          branch: isOwner ? "KKD_Main Branch" : branch,
          patientName, date: r.date || todayStr(),
          items: [{ name: itemName, qty: Number(r.qty) || 1, price: Number(r.price) || 0 }],
          discount: Number(r.discount) || 0,
          approvalStatus: "approved", status: "Pending",
          createdBy: session.id, createdByName: session.name, createdAt: ts(),
        });
        added++;
      }
      if (newRecords.length) mutate("invoices", arr => [...arr, ...newRecords]);
      audit("IMPORT_CSV", { type: "invoices", added, skipped });
      setMsg(`Imported ${added} invoice(s). Skipped ${skipped} (missing patient or item name).`);
    });
  };
  
  return (
    <div>
      <SectionHeader title="Sales & Invoices" onSync={onSync} syncing={syncing} onTemplate={() => downloadCSVTemplate(INV_CSV_HEADERS, "invoices_template.csv")} onImport={(can("invoices", "add") || isOwner) ? handleImportInvoices : null} onExport={() => exportCSV(rows, "invoices.csv")} onAdd={can("invoices", "add") ? () => { setForm({ patientName: "", date: todayStr(), items: [], discount: 0 }); setErr(""); setModal(true); } : null} msg={msg} />
      <div className="card" style={{ overflowX: "auto" }}>
        <table><thead><tr><th>Invoice</th><th>Date</th><th>Patient</th><th>Total</th><th>Status</th><th>By</th><th>Branch</th>{isOwner && <th></th>}</tr></thead>
          <tbody>{rows.map(inv => (
            <tr key={inv.id}>
              <td style={{ fontWeight: 700 }}>{inv.id}</td><td>{inv.date}</td><td>{inv.patientName}</td><td style={{ fontWeight: 700 }}>{currency(total(inv))}</td>
              <td><span className={`tag ${inv.status === "Paid" ? "tag-green" : "tag-yellow"}`}>{inv.status}</span></td><td style={{ fontSize: 11, color: "#9b8e82" }}>{inv.createdByName || "—"}</td><td><span className="tag" style={{ background: "#f0ede8", color: "#6b5e52" }}>{inv.branch}</span></td>
              <td style={{ display: "flex", gap: 5 }}>
                <button className="btn btn-sm" style={{ background:"#1f2937", color:"#fff", border:"none", fontWeight:700 }} onClick={() => handleGenerateInvoice(inv)}>🧾 Generate Invoice</button>
                {(isOwner || can("invoices", "edit")) && inv.status === "Pending" && <button className="btn btn-sm" style={{ background: "#dcfce7", color: "#16a34a", border: "none", fontWeight: 700 }} onClick={() => mutate("invoices", arr => arr.map(i => i.id === inv.id ? { ...i, status: "Paid" } : i))}>✓ Paid</button>}
                {isOwner && <button className="btn btn-danger btn-sm" onClick={() => { if (confirm("Delete?")) mutate("invoices", arr => arr.filter(i => i.id !== inv.id), null, inv.id); }}>✕</button>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {modal && (
        <Modal title="New Invoice" onClose={() => setModal(false)} onSave={save} saveLabel="Create Invoice" wide>
          {err && <div style={{ marginBottom: 14, fontSize: 13, padding: "8px 14px", borderRadius: 8, background: "#fee2e2", color: "#dc2626" }}>{err}</div>}
          <div className="form-grid" style={{ marginBottom: 14 }}><div><label>Patient Name</label><input type="text" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} /></div><div><label>Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div></div>
          <label>Add Item</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><input type="text" placeholder="Item name" value={lN} onChange={e => setLN(e.target.value)} style={{ flex: 2 }} /><input type="number" placeholder="Qty" value={lQ} onChange={e => setLQ(e.target.value)} style={{ width: 60 }} /><input type="number" placeholder="₹" value={lP} onChange={e => setLP(e.target.value)} style={{ width: 90 }} /><button className="btn btn-dark btn-sm" onClick={addLine}>Add</button></div>
          {form.items.length > 0 && <div style={{ background: "#faf9f7", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>{form.items.map((l, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}><span>{l.name} × {l.qty}</span><span style={{ fontWeight: 600 }}>{currency(l.qty * l.price)}</span></div>)}<div style={{ borderTop: "1px solid #e8e2db", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 700 }}><span>Sub</span><span>{currency(sub)}</span></div></div>}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}><div style={{ flex: 1 }}><label>Discount (₹)</label><input type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} /></div><div style={{ flex: 1 }}><div style={{ fontSize: 11, color: "#9b8e82" }}>TOTAL</div><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700 }}>{currency(sub - Number(form.discount))}</div></div></div>
        </Modal>
      )}
      {invoiceRow && <InvoiceTemplateEditor row={invoiceRow} data={data} onClose={() => setInvoiceRow(null)} />}
    </div>
  );
}

function AlertsSection({ session, data, mutate, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "KKD_Main Branch";
  const low     = safeArray(data.stock).filter(s => (isOwner || s.branch === branch) && s.qty <= s.reorder);
  const [modal, setModal] = useState(null); const [qty, setQty] = useState(0);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div className="section-title">Low Stock Alerts</div>
        <div style={{ display: "flex", gap: 10 }}>{onSync && <button className="btn btn-outline btn-sm" onClick={onSync} disabled={syncing}>{syncing ? "⟳ Syncing…" : "⟳ Sync"}</button>}<button className="btn btn-outline btn-sm" onClick={() => exportCSV(low.map(({ id, ...r }) => r), "low_stock.csv")}>⬇ CSV</button></div>
      </div>
      {low.length === 0 ? <div className="card" style={{ textAlign: "center", padding: 48, color: "#9b8e82" }}><div style={{ fontSize: 36, marginBottom: 10 }}>✓</div><div style={{ fontWeight: 600 }}>All stock levels healthy</div></div> : low.map(s => (
        <div key={s.id} style={{ background: "#fff9f5", border: "1.5px solid #fed7aa", borderRadius: 12, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontWeight: 700 }}>{s.name}</div><div style={{ fontSize: 12, color: "#9b8e82", marginTop: 2 }}>{s.sku} · {s.branch} · Box: {s.boxNo || "—"}</div></div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}><div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: "#9b8e82" }}>Stock / Reorder</div><div><span style={{ fontWeight: 700, color: "#dc2626", fontSize: 16 }}>{s.qty}</span><span style={{ color: "#9b8e82" }}> / {s.reorder}</span></div></div>{isOwner && <button className="btn btn-dark btn-sm" onClick={() => { setModal(s); setQty(s.reorder - s.qty + 10); }}>+ Restock</button>}</div>
        </div>
      ))}
      {modal && <Modal title="Restock" onClose={() => setModal(null)} onSave={() => { mutate("stock", p => p.map(s => s.id === modal.id ? { ...s, qty: s.qty + Number(qty) } : s)); setModal(null); }} saveLabel="Update" width={360}><div style={{ fontSize: 13, color: "#9b8e82", marginBottom: 12 }}>{modal.name}</div><label>Units to Add</label><input type="number" min={1} value={qty} onChange={e => setQty(e.target.value)} /><div style={{ fontSize: 13, color: "#9b8e82", marginTop: 8 }}>New total: {modal.qty + Number(qty)}</div></Modal>}
    </div>
  );
}

function TasksSection({ session, data, mutate, audit, accounts, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const allTasks = safeArray(data.tasks);
  const rows = isOwner ? allTasks : allTasks.filter(t => t.assignedTo === session.id);
  const [modal, setModal] = useState(false); const [form,  setForm]  = useState({});
  const [msg,   setMsg]   = useState(""); const [filter,setFilter]= useState("all"); 
  const staffList = safeArray(accounts).filter(a => a.role === "staff");
  const blank = () => ({ title: "", description: "", assignedTo: staffList[0]?.id || "", deadline: todayStr(), priority: "Medium" });
  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    if (!form.title.trim()) { setMsg("Task title required."); return; }
    const record = { id: uid(), ...form, status: "pending", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("tasks", arr => [...arr, record], record); audit("TASK_ASSIGN", { title: form.title, assignedTo: form.assignedTo }); setModal(false); setMsg("Task assigned.");
  };

  const markDone = (task) => {
    const updated = { ...task, status: "done", completedAt: ts() };
    mutate("tasks", arr => arr.map(x => x.id === task.id ? updated : x), updated); audit("TASK_COMPLETE", { title: task.title });
  };
  const del = id => { if (confirm("Delete task?")) { mutate("tasks", arr => arr.filter(x => x.id !== id), null, id); audit("DELETE", { type:"tasks", id }); } };
  const isOverdue = t => t.status === "pending" && new Date(t.deadline) < new Date(todayStr());
  const filtered = rows.filter(t => { if (filter === "pending") return t.status === "pending" && !isOverdue(t); if (filter === "done") return t.status === "done"; if (filter === "overdue") return isOverdue(t); return true; });
  const staffName = id => staffList.find(s => s.id === id)?.name || id;
  const priorityColor = p => ({ High:"#dc2626", Medium:"#d97706", Low:"#16a34a" }[p] || "#9b8e82");

  return (
    <div>
      <SectionHeader title="Tasks" onSync={onSync} syncing={syncing} onAdd={isOwner ? () => { setForm(blank()); setMsg(""); setModal(true); } : null} msg={msg} />
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>{["all","pending","overdue","done"].map(f => (<button key={f} className={`btn btn-sm ${filter===f?"btn-dark":"btn-outline"}`} onClick={()=>setFilter(f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>))}</div>
      <div style={{ display:"grid", gap:10 }}>
        {filtered.length === 0 && <div style={{ color:"#9b8e82", fontSize:13, padding:20, textAlign:"center" }}>No tasks here.</div>}
        {filtered.map(t => (
          <div key={t.id} className="card" style={{ padding:"16px 18px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:14, borderLeft: `4px solid ${t.status==="done" ? "#16a34a" : isOverdue(t) ? "#dc2626" : priorityColor(t.priority)}` }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}><div style={{ fontWeight:700, fontSize:15, textDecoration: t.status==="done" ? "line-through" : "none", color: t.status==="done" ? "#9b8e82" : "#1a1714" }}>{t.title}</div><span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, fontWeight:700, background:`${priorityColor(t.priority)}20`, color:priorityColor(t.priority) }}>{t.priority}</span>{isOverdue(t) && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, fontWeight:700, background:"#fee2e2", color:"#dc2626" }}>⚠ Overdue</span>}{t.status==="done" && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, fontWeight:700, background:"#dcfce7", color:"#16a34a" }}>✓ Done</span>}</div>
              {t.description && <div style={{ fontSize:13, color:"#6b5e52", marginBottom:6 }}>{t.description}</div>}
              <div style={{ fontSize:12, color:"#9b8e82", display:"flex", gap:14 }}><span>👤 {staffName(t.assignedTo)}</span><span>📅 Due {t.deadline}</span></div>
            </div>
            <div style={{ display:"flex", gap:8 }}>{t.status === "pending" && (!isOwner ? t.assignedTo === session.id : true) && (<button className="btn btn-outline btn-sm" onClick={()=>markDone(t)}>Mark Done</button>)}{isOwner && <button className="btn btn-danger btn-sm" onClick={()=>del(t.id)}>✕</button>}</div>
          </div>
        ))}
      </div>
      {modal && (
        <Modal title="Assign Task" onClose={()=>setModal(false)} onSave={submit} saveLabel="Assign Task">
          <div style={{ display:"grid", gap:14 }}>
            <div><label>Title *</label><input type="text" value={form.title} onChange={F("title")} /></div><div><label>Description</label><textarea rows={3} value={form.description} onChange={F("description")} /></div>
            <div><label>Assign To</label><select value={form.assignedTo} onChange={F("assignedTo")}>{staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.branch})</option>)}</select></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}><div><label>Deadline</label><input type="date" value={form.deadline} onChange={F("deadline")} /></div><div><label>Priority</label><select value={form.priority} onChange={F("priority")}><option>Low</option><option>Medium</option><option>High</option></select></div></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function RemindersSection({ session, data, mutate, audit, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "KKD_Main Branch";
  const allReminders = safeArray(data.reminders);
  const rows = isOwner ? allReminders : allReminders.filter(r => r.branch === branch);

  const [modal, setModal] = useState(false); const [form,  setForm]  = useState({});
  const [msg,   setMsg]   = useState(""); const [mrLookup, setMrLookup] = useState("");
  const [filter, setFilter] = useState("upcoming");

  const blank = () => ({ mrNo: "", patientId: "", name: "", phone: "", reminderType: "Lens Delivery", reminderDate: todayStr(), reminderTime: "09:00", notes: "", branch: isOwner ? "KKD_Main Branch" : branch });
  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const lookupPatient = (query) => {
    const found = safeArray(data.patients).find(p => p.mrNo?.toLowerCase() === query.toLowerCase() || p.patientId?.toLowerCase() === query.toLowerCase() || p.phone === query);
    if (found) { setForm(f => ({ ...f, mrNo: found.mrNo||"", patientId: found.patientId||"", name: found.name, phone: found.phone })); setMrLookup(`✓ Found: ${found.name} (${found.patientId})`); } else { setMrLookup("No match found."); }
  };

  const submit = () => {
    if (!form.name.trim() || !form.reminderDate) { setMsg("Name and reminder date required."); return; }
    const record = { id: uid(), ...form, status: "pending", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("reminders", arr => [...arr, record], record); audit("REMINDER_ADD", { name: form.name, type: form.reminderType }); setModal(false); setMsg("Reminder set.");
  };

  const markDone = (rem) => { const updated = { ...rem, status: "done", completedAt: ts() }; mutate("reminders", arr => arr.map(x => x.id === rem.id ? updated : x), updated); };
  const del = id => { if (confirm("Delete reminder?")) { mutate("reminders", arr => arr.filter(x => x.id !== id), null, id); audit("DELETE", { type:"reminders", id }); } };
  const isOverdue = r => reminderOverdue(r);
  const isToday    = r => r.reminderDate === todayStr();
  const filtered = rows.filter(r => { if (filter === "upcoming") return r.status === "pending"; if (filter === "done") return r.status === "done"; return true; }).sort((a,b) => new Date(a.reminderDate) - new Date(b.reminderDate));
  const typeIcon = t => ({ "Lens Delivery":"🕶", "Follow-up Visit":"🔁", "Payment Due":"💰", "Review":"📋" }[t] || "🔔");

  return (
    <div>
      <SectionHeader title="Reminders" onSync={onSync} syncing={syncing} onAdd={() => { setForm(blank()); setMsg(""); setMrLookup(""); setModal(true); }} msg={msg} />
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>{["upcoming","done","all"].map(f => (<button key={f} className={`btn btn-sm ${filter===f?"btn-dark":"btn-outline"}`} onClick={()=>setFilter(f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>))}</div>
      <div style={{ display:"grid", gap:10 }}>
        {filtered.length === 0 && <div style={{ color:"#9b8e82", fontSize:13, padding:20, textAlign:"center" }}>No reminders here.</div>}
        {filtered.map(r => (
          <div key={r.id} className="card" style={{ padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:14, borderLeft: `4px solid ${r.status==="done" ? "#16a34a" : isOverdue(r) ? "#dc2626" : isToday(r) ? "#d97706" : "#9b8e82"}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, flex:1 }}><div style={{ fontSize:22 }}>{typeIcon(r.reminderType)}</div><div><div style={{ fontWeight:700, fontSize:14, textDecoration: r.status==="done"?"line-through":"none", color: r.status==="done"?"#9b8e82":"#1a1714" }}>{r.name} <span style={{ fontWeight:400, color:"#9b8e82", fontSize:12 }}>({r.mrNo || r.patientId || "—"})</span></div><div style={{ fontSize:12, color:"#6b5e52" }}>{r.reminderType} · {r.phone}</div>{r.notes && <div style={{ fontSize:12, color:"#9b8e82", marginTop:2 }}>{r.notes}</div>}</div></div>
            <div style={{ textAlign:"right" }}><div style={{ fontWeight:700, fontSize:13, color: isOverdue(r)?"#dc2626":isToday(r)?"#d97706":"#1a1714" }}>{r.reminderDate}{r.reminderTime ? ` · ${r.reminderTime}` : ""}</div>{isOverdue(r) && <div style={{ fontSize:10, color:"#dc2626", fontWeight:700 }}>OVERDUE</div>}{isToday(r) && !isOverdue(r) && <div style={{ fontSize:10, color:"#d97706", fontWeight:700 }}>TODAY</div>}</div>
            <div style={{ display:"flex", gap:6 }}>{r.status === "pending" && <button className="btn btn-outline btn-sm" onClick={()=>markDone(r)}>Done</button>}<button className="btn btn-danger btn-sm" onClick={()=>del(r.id)}>✕</button></div>
          </div>
        ))}
      </div>
      {modal && (
        <Modal title="Set Reminder" onClose={()=>setModal(false)} onSave={submit} saveLabel="Set Reminder">
          <div style={{ background:"#f0ede8", borderRadius:10, padding:"12px 14px", marginBottom:14 }}><label style={{ fontWeight:700 }}>🔗 Look Up Patient</label><div style={{ display:"flex", gap:8, marginTop:6 }}><input type="text" placeholder="Enter MR-001 or phone…" value={form._lookup||""} onChange={e=>setForm(f=>({...f,_lookup:e.target.value}))} style={{ flex:1 }} /><button className="btn btn-dark btn-sm" onClick={()=>lookupPatient(form._lookup||"")}>Look Up</button></div>{mrLookup && <div style={{ fontSize:12,marginTop:6,color:mrLookup.startsWith("✓")?"#16a34a":"#dc2626" }}>{mrLookup}</div>}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div><label>MR No</label><input type="text" value={form.mrNo} readOnly style={{ background:"#f0ede8", color:"#9b8e82" }} /></div><div><label>Patient ID</label><input type="text" value={form.patientId} readOnly style={{ background:"#f0ede8", color:"#9b8e82" }} /></div>
            <div style={{ gridColumn:"1/-1" }}><label>Name *</label><input type="text" value={form.name} onChange={F("name")} /></div><div><label>Phone</label><input type="text" maxLength={10} value={form.phone} onChange={F("phone")} /></div>
            <div><label>Reminder Type</label><select value={form.reminderType} onChange={F("reminderType")}>{["Lens Delivery","Follow-up Visit","Payment Due","Review"].map(t=><option key={t}>{t}</option>)}</select></div>
            <div><label>Reminder Date *</label><input type="date" value={form.reminderDate} onChange={F("reminderDate")} /></div><div><label>Deadline Time</label><input type="time" value={form.reminderTime || ""} onChange={F("reminderTime")} /></div><div style={{ gridColumn:"1/-1" }}><label>Notes</label><textarea rows={2} value={form.notes} onChange={F("notes")} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function UsersSection({ accounts, setAccounts, audit }) {
  const staff = safeArray(accounts).filter(a => a.role === "staff");
  const [modal, setModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ id: "", name: "", designation: DESIGNATIONS[0], branch: BRANCHES[0], password: "" });
  
  const openAdd = () => { setForm({ id: "", name: "", designation: DESIGNATIONS[0], branch: BRANCHES[0], password: "" }); setEditMode(false); setModal(true); };
  const openEdit = (acc) => { setForm({ ...acc }); setEditMode(true); setModal(true); };

  const saveStaff = () => {
    if (!form.id || !form.name || !form.password) { alert("Fill all fields."); return; }
    if (editMode) {
      setAccounts(p => safeArray(p).map(a => a.id === form.id ? { ...a, ...form } : a));
      audit("EDIT_STAFF", { userId: form.id, name: form.name });
    } else {
      if (safeArray(accounts).find(a => a.id === form.id)) { alert("User ID already exists."); return; }
      const perms = {}; SECTIONS.forEach(s => { perms[s] = { view: false, add: false, edit: false }; });
      setAccounts(p => [...safeArray(p), { ...form, role: "staff", perms }]);
      audit("CREATE_STAFF", { userId: form.id, name: form.name });
    }
    setModal(false);
  };
  
  const delStaff = id => { if (confirm("Delete staff?")) { setAccounts(p => safeArray(p).filter(a => a.id !== id)); audit("DELETE_STAFF", { userId: id }); } };
  
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div className="section-title">Manage Staff</div><button className="btn btn-dark btn-sm" onClick={openAdd}>+ Add Staff</button>
      </div>
      <div style={{ marginBottom: 14, fontSize: 13, color: "#9b8e82" }}>Use <strong>Dashboard Builder</strong> to control field visibility and section permissions per staff member.</div>
      {staff.map(acc => (
        <div key={acc.id} className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontWeight: 700, fontSize: 15 }}>{acc.name} <span style={{ fontSize: 12, fontWeight: 400, color: "#6b5e52", background: "#f0ede8", padding: "2px 8px", borderRadius: 12, marginLeft: 6 }}>{acc.designation}</span></div><div style={{ fontSize: 12, color: "#9b8e82", marginTop: 4 }}>ID: <code style={CS}>{acc.id}</code> · {acc.branch} · Password: <code style={CS}>{acc.password}</code></div></div>
            <div style={{ display: "flex", gap: 8 }}><button className="btn btn-outline btn-sm" onClick={() => openEdit(acc)}>Edit</button><button className="btn btn-danger btn-sm" onClick={() => delStaff(acc.id)}>Delete</button></div>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SECTIONS.map(s => (
              <div key={s} style={{ fontSize: 11, background: "#f0ede8", borderRadius: 20, padding: "2px 10px" }}>
                {SECTION_LABELS[s]}: {["view", "add", "edit"].filter(a => acc.perms?.[s]?.[a]).join("/") || "none"}
              </div>
            ))}
          </div>
        </div>
      ))}
      {modal && (
        <Modal title={editMode ? "Edit Staff" : "Add New Staff"} onClose={() => setModal(false)} onSave={saveStaff} saveLabel={editMode ? "Update Account" : "Create Account"}>
          <div className="form-grid">
            <div><label>User ID (login)</label><input type="text" value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} readOnly={editMode} style={editMode ? { background: "#f0ede8", color: "#9b8e82" } : {}} /></div>
            <div><label>Name</label><input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label>Designation</label><select value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}>{DESIGNATIONS.map(d => <option key={d}>{d}</option>)}</select></div>
            <div><label>Branch</label><select value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}>{BRANCHES.map(b => <option key={b}>{b}</option>)}</select></div>
            <div><label>Password</label><input type="text" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function SupabaseSection({ sbCreds, sbStatus, onConnect, onSync, onPush }) {
  const [url, setUrl]   = useState(sbCreds.url || "");
  const [key, setKey]   = useState(sbCreds.key || "");
  const [msg, setMsg]   = useState("");
  const connect = async () => { setMsg("Testing connection…"); const ok = await onConnect(url, key); setMsg(ok ? "✅ Connected!" : "❌ Invalid URL or key format."); };
  const statusColor = { ok: "#16a34a", error: "#dc2626", testing: "#d97706", pushing: "#1d4ed8", syncing: "#7c3aed", idle: "#9b8e82" };

  return (
    <div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Cloud Sync</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 13 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: statusColor[sbStatus] || "#9b8e82", display: "inline-block" }} />Status: <strong>{sbStatus}</strong></div>
          <div style={{ display: "grid", gap: 12 }}><div><label>Supabase URL</label><input type="text" value={url} onChange={e => setUrl(e.target.value)} /></div><div><label>Anon Key</label><input type="text" value={key} onChange={e => setKey(e.target.value)} /></div></div>
          {msg && <div style={{ marginTop: 10, fontSize: 13 }}>{msg}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}><button className="btn btn-dark btn-sm" onClick={connect}>🔌 Connect & Test</button><button className="btn btn-outline btn-sm" onClick={onSync}>⬇ Pull from DB</button><button className="btn btn-outline btn-sm" onClick={onPush}>⬆ Push to DB</button></div>
        </div>
      </div>
    </div>
  );
}

function LaunchGuide() { return <div style={{ padding: 20 }}>See previous instructions for launch steps.</div>; }

function SectionHeader({ title, onAdd, onExport, onImport, onTemplate, onSync, syncing, msg }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="section-title">{title}</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {onSync && <button className="btn btn-outline btn-sm" onClick={onSync} disabled={syncing}>{syncing ? "⟳ Syncing…" : "⟳ Sync"}</button>}
          {onTemplate && <button className="btn btn-outline btn-sm" onClick={onTemplate} title="Download CSV template">⬇ Template</button>}
          {onImport && <button className="btn btn-outline btn-sm" onClick={onImport}>⬆ Import CSV</button>}
          {onExport && <button className="btn btn-outline btn-sm" onClick={onExport}>⬇ CSV</button>}
          {onAdd && <button className="btn btn-dark btn-sm" onClick={onAdd}>+ Add</button>}
        </div>
      </div>
      {msg && <div style={{ marginTop: 8, fontSize: 13, padding: "8px 14px", borderRadius: 8, background: "#dcfce7", color: "#16a34a" }}>{msg}</div>}
    </div>
  );
}

// ── Read-only grouped view of a patient + K-Sheet record ─────────────
// Mirrors the 5 K-Sheet tabs:
//   1. Patient Info, 2. History & Vitals, 3. Acuity & Retinoscopy,
//   4. AR & Subjective, 5. Eye Exam (MD)
function PatientFullView({ patient, kSheet, kSheetCount }) {
  const k = kSheet || {};
  const p = patient || {};
  const get = (key) => {
    const v = k[key] !== undefined && k[key] !== "" ? k[key] : p[key];
    return v === "" || v === undefined || v === null ? "—" : String(v);
  };
  const Row = ({ label, value }) => (
    <div style={{ background:"#faf9f7", border:"1px solid #f0ede8", borderRadius:8, padding:"8px 10px" }}>
      <div style={{ fontSize:10, color:"#9b8e82", textTransform:"uppercase", fontWeight:700, letterSpacing:".05em" }}>{label}</div>
      <div style={{ fontFamily:"monospace", wordBreak:"break-word", marginTop:3, fontSize:12 }}>{value}</div>
    </div>
  );
  const Section = ({ title, children, cols = 3 }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize: 14, fontWeight: 700, marginBottom: 8, color:"#3b2f25", borderBottom:"1px solid #e8e2db", paddingBottom: 6 }}>{title}</div>
      <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols}, 1fr)`, gap: 8 }}>{children}</div>
    </div>
  );
  return (
    <div>
      {typeof kSheetCount === "number" && (
        <div style={{ marginBottom: 14, fontSize: 12, color:"#6b5e52" }}>
          {kSheetCount > 0
            ? `Showing most recent K Sheet · ${kSheetCount} total record(s) for this patient.`
            : "No K Sheet records yet for this patient."}
        </div>
      )}

      <Section title="1. Patient Info">
        <Row label="MR No" value={get("mrNo")} />
        <Row label="Patient ID" value={get("patientId")} />
        <Row label="Name" value={get("name")} />
        <Row label="Phone" value={get("phone")} />
        <Row label="Gender" value={get("gender")} />
        <Row label="Age" value={get("age")} />
        <Row label="Designation" value={get("designation")} />
        <Row label="Aadhar No" value={get("aadharNo")} />
        <Row label="Address" value={get("address")} />
        <Row label="Visit Type" value={get("visitType")} />
        <Row label="Branch" value={get("branch")} />
        <Row label="Date" value={get("date")} />
        <Row label="Time" value={get("time")} />
        <Row label="Ref / Camp" value={get("ref")} />
        <Row label="Payment Mode" value={get("paymentMode")} />
        <Row label="Payment Amount" value={get("paymentAmount")} />
        <Row label="Remarks" value={get("remarks")} />
      </Section>

      <Section title="2. History & Vitals (Optom)" cols={3}>
        <Row label="Complaint" value={get("complaint")} />
        <Row label="Past History" value={get("pastHistory")} />
        <Row label="Optom Name" value={get("optom")} />
        <Row label="HTN" value={get("htn")} />
        <Row label="HTN Rx" value={get("htnRx")} />
        <Row label="DM" value={get("dm")} />
        <Row label="DM Rx" value={get("dmRx")} />
        <Row label="CAD" value={get("cad")} />
        <Row label="CAD Rx" value={get("cadRx")} />
        <Row label="Asthmatic" value={get("asthmatic")} />
        <Row label="Asthmatic Rx" value={get("asthmaticRx")} />
        <Row label="Allergies" value={get("allergies")} />
        <Row label="Allergies Rx" value={get("allergiesRx")} />
        <Row label="Others" value={get("others")} />
        <Row label="Others Rx" value={get("othersRx")} />
        <Row label="IOP" value={get("iop")} />
        <Row label="BP" value={get("bp")} />
        <Row label="Ducts" value={get("ducts")} />
        <Row label="RBS" value={get("rbs")} />
        <Row label="Dilated With" value={get("dilatedWith")} />
        <Row label="Dilated Continuee" value={get("dilatedContinuee")} />
      </Section>

      <Section title="3. Acuity & Retinoscopy" cols={4}>
        <Row label="PG.OD" value={get("pgOd")} />
        <Row label="PG.OD Add" value={get("pgOdAdd")} />
        <Row label="PG.OS" value={get("pgOs")} />
        <Row label="PG.OS Add" value={get("pgOsAdd")} />
        <Row label="VA OD" value={get("vaOd")} />
        <Row label="OD cPGP" value={get("odCpgp")} />
        <Row label="OD PH" value={get("odPh")} />
        <Row label="OD NV" value={get("odNv")} />
        <Row label="OD PGP-" value={get("odPgp")} />
        <Row label="VA OS" value={get("vaOs")} />
        <Row label="OS cPGP" value={get("osCpgp")} />
        <Row label="OS PH" value={get("osPh")} />
        <Row label="OS PV / NV" value={get("osPv")} />
        <Row label="OS PGP-" value={get("osPgp")} />
        <Row label="Retinoscopy OD" value={get("retinoscopyOd")} />
        <Row label="Retinoscopy OS" value={get("retinoscopyOs")} />
      </Section>

      <Section title="4. AR & Subjective" cols={3}>
        <Row label="RE AR Sph" value={get("reSpherAR")} />
        <Row label="RE AR Cyl" value={get("reCylAR")} />
        <Row label="RE AR Axis" value={get("reAxisAR")} />
        <Row label="LE AR Sph" value={get("leSpherAR")} />
        <Row label="LE AR Cyl" value={get("leCylAR")} />
        <Row label="LE AR Axis" value={get("leAxisAR")} />
        <Row label="RE Sub Sph" value={get("reSpherSub")} />
        <Row label="RE Sub Cyl" value={get("reCylSub")} />
        <Row label="RE Sub Axis" value={get("reAxisSub")} />
        <Row label="LE Sub Sph" value={get("leSpherSub")} />
        <Row label="LE Sub Cyl" value={get("leCylSub")} />
        <Row label="LE Sub Axis" value={get("leAxisSub")} />
        <Row label="ADD" value={get("add")} />
      </Section>

      <Section title="5. Eye Exam (MD)" cols={3}>
        <Row label="Eyelids" value={get("eyelids")} />
        <Row label="Conjunctiva" value={get("conjunctiva")} />
        <Row label="Cornea" value={get("cornea")} />
        <Row label="Anterior Chamber" value={get("anteriorChamber")} />
        <Row label="Iris" value={get("iris")} />
        <Row label="Pupil" value={get("pupil")} />
        <Row label="Lens" value={get("lens")} />
        <Row label="Ocular Movements" value={get("ocularMovements")} />
        <Row label="Fundus" value={get("fundus")} />
        <Row label="Advice" value={get("advice")} />
        <Row label="Ophthalmologist" value={get("ophthalmologist")} />
      </Section>
    </div>
  );
}

function Modal({ title, children, onClose, onSave, saveLabel = "Save", wide, xl, width }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: xl ? "min(920px,96vw)" : wide ? "min(700px,96vw)" : width ? width : "min(560px,96vw)" }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, marginBottom: 18 }}>{title}</div>{children}
        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}><button className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-dark" onClick={onSave}>{saveLabel}</button></div>
      </div>
    </div>
  );
}
// ════════════════════════════════════════════════════════════════════════
// Patient Status — cross-section lookup of every patient's current stage
// ════════════════════════════════════════════════════════════════════════
function PatientStatusSection({ session, data, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "KKD_Main Branch";
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("ALL");
  const [todayOnly, setTodayOnly] = useState(false);
  const [filterField, setFilterField] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const FS_FIELDS = [
    { key:"date", label:"Registered Date" }, { key:"mrNo", label:"MR No" }, { key:"patientId", label:"Patient ID" },
    { key:"name", label:"Name" }, { key:"phone", label:"Phone" }, { key:"branch", label:"Branch" },
  ];

  const today = todayStr();
  const isToday = (d) => {
    if (!d) return false;
    if (typeof d === "string" && d.startsWith(today)) return true;
    try {
      const parts = String(d).split(/[\s/,-]/).filter(Boolean);
      if (parts.length >= 3) {
        const [dd, mm, yyyy] = parts;
        const iso = `${yyyy.padStart(4,"0")}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
        if (iso === today) return true;
      }
    } catch {}
    return false;
  };

  const all = dedupePatientVisits(safeArray(data.patients).filter(p => isOwner || p.branch === branch));
  const enriched = all.map(p => ({ ...p, _status: getPatientStatus(p, data) }));
  // Base set respects the "Today only" toggle so the status tiles and the list
  // always show matching numbers.
  const base = enriched.filter(p => !todayOnly || isToday(p.date));
  const filtered = sortRows(base.filter(p => {
    if (statusF !== "ALL" && p._status.key !== statusF) return false;
    return matchSearch(p, search, FS_FIELDS, filterField);
  }), sortKey, sortDir);

  const tally = Object.values(PATIENT_STATUS).map(s => ({ ...s, count: base.filter(p => p._status.key === s.key).length }));

  return (
    <div>
      <SectionHeader title="Patient Status" onSync={onSync} syncing={syncing} onExport={() => exportCSV(filtered.map(p => ({ mrNo:p.mrNo, patientId:p.patientId, name:p.name, phone:p.phone, branch:p.branch, registered:p.date, status:p._status.label })), "patient_status.csv")} msg="" />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:10, marginBottom:16 }}>
        {tally.map(t => (
          <div key={t.key} onClick={() => setStatusF(s => s === t.key ? "ALL" : t.key)} style={{ cursor:"pointer", padding:"12px 14px", borderRadius:12, background:t.bg, color:t.color, border: statusF === t.key ? `2px solid ${t.color}` : "2px solid transparent" }}>
            <div style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".06em", opacity:.85 }}>{t.label}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:800 }}>{t.count}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
        <input type="text" placeholder="🔍 Search name / MR / Patient ID / phone…" value={search} onChange={e=>setSearch(e.target.value)} style={{ flex:"1 1 220px", minWidth:200, maxWidth:340, borderRadius:10, border:"1px solid #e8e2db", padding:"8px 14px", fontSize:13 }} />
        <select value={filterField} onChange={e=>setFilterField(e.target.value)} style={_fsSelStyle} title="Filter by a specific field"><option value="">🔎 All fields</option>{FS_FIELDS.map(f => <option key={f.key} value={f.key}>In: {f.label}</option>)}</select>
        <select value={sortKey} onChange={e=>setSortKey(e.target.value)} style={_fsSelStyle} title="Sort by">{FS_FIELDS.map(f => <option key={f.key} value={f.key}>Sort: {f.label}</option>)}</select>
        <button className="btn btn-outline btn-sm" onClick={()=>setSortDir(d=>d==="asc"?"desc":"asc")} title="Toggle ascending / descending">{sortDir==="asc"?"↑ Asc":"↓ Desc"}</button>
        <button className={`btn btn-sm ${todayOnly?"btn-dark":"btn-outline"}`} onClick={()=>setTodayOnly(t=>!t)}>{todayOnly?"📅 Today only ✓":"📅 Today only"}</button>
        <button className={`btn btn-sm ${statusF==="ALL"?"btn-dark":"btn-outline"}`} onClick={()=>setStatusF("ALL")}>All Statuses</button>
        <div style={{ fontSize:12, color:"#9b8e82", marginLeft:"auto" }}>{filtered.length} patient(s)</div>
      </div>
      <div className="card" style={{ overflowX:"auto" }}>
        <table>
          <thead><tr><th>MR No</th><th>Patient ID</th><th>Name</th><th>Phone</th><th>Branch</th><th>Registered</th><th>Current Status</th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign:"center", color:"#9b8e82", padding:24 }}>No patients match.</td></tr>}
            {filtered.map(p => (
              <tr key={p.id}>
                <td style={{ fontFamily:"monospace", fontWeight:700 }}>{p.mrNo || "—"}</td>
                <td style={{ fontFamily:"monospace", color:"#1d4ed8" }}>{p.patientId || "—"}</td>
                <td style={{ fontWeight:600 }}>{p.name}</td>
                <td>{p.phone}</td>
                <td><span className="tag" style={{ background:"#f0ede8", color:"#6b5e52" }}>{p.branch}</span></td>
                <td style={{ fontSize:11, color:"#9b8e82" }}>{p.date}</td>
                <td><span className="tag" style={{ background:p._status.bg, color:p._status.color }}>{p._status.label}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Dashboard CMS — edit blocks (title, color, icon, order, enabled) + panels
// ════════════════════════════════════════════════════════════════════════
function DashboardCMS({ dashCms, setDashCms }) {
  const cms = dashCms || DEFAULT_DASH_CMS;
  const [tab, setTab] = useState("blocks");

  const updBlock = (key, patch) => setDashCms(c => ({ ...c, blocks: { ...c.blocks, [key]: { ...c.blocks[key], ...patch } } }));
  const updPanel = (key, patch) => setDashCms(c => ({ ...c, panels: { ...c.panels, [key]: { ...c.panels[key], ...patch } } }));
  const reset = () => { if (confirm("Reset dashboard to defaults?")) setDashCms(DEFAULT_DASH_CMS); };

  const PALETTES = [
    { label: "Amber",  bg: "linear-gradient(135deg,#fef3c7,#fde68a)", color: "#92400e" },
    { label: "Blue",   bg: "linear-gradient(135deg,#dbeafe,#bfdbfe)", color: "#1e3a8a" },
    { label: "Green",  bg: "linear-gradient(135deg,#dcfce7,#bbf7d0)", color: "#14532d" },
    { label: "Pink",   bg: "linear-gradient(135deg,#fce7f3,#fbcfe8)", color: "#9d174d" },
    { label: "Purple", bg: "linear-gradient(135deg,#ede9fe,#ddd6fe)", color: "#5b21b6" },
    { label: "Teal",   bg: "linear-gradient(135deg,#ccfbf1,#99f6e4)", color: "#115e59" },
    { label: "Slate",  bg: "linear-gradient(135deg,#e2e8f0,#cbd5e1)", color: "#1e293b" },
    { label: "Orange", bg: "linear-gradient(135deg,#ffedd5,#fed7aa)", color: "#9a3412" },
  ];

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700 }}>🎨 Dashboard CMS</div>
          <div style={{ fontSize:13, color:"#9b8e82", marginTop:4 }}>Edit titles, colors, icons, order and visibility of every dashboard block. Saved to this device.</div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={reset}>↺ Reset to Defaults</button>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:18 }}>
        <button className={`btn btn-sm ${tab==="blocks"?"btn-dark":"btn-outline"}`} onClick={()=>setTab("blocks")}>📊 Stat Blocks</button>
        <button className={`btn btn-sm ${tab==="panels"?"btn-dark":"btn-outline"}`} onClick={()=>setTab("panels")}>🗂 Panels</button>
      </div>

      {tab === "blocks" && (
        <div style={{ display:"grid", gap:14 }}>
          {Object.entries(cms.blocks).sort((a,b) => (a[1].order||0)-(b[1].order||0)).map(([key, b]) => (
            <div key={key} className="card" style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:18 }}>
              <div style={{ borderRadius:14, padding:"16px 18px", background:b.bg, color:b.color, opacity: b.enabled === false ? .4 : 1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em" }}>{b.title}</div>
                  <div style={{ fontSize:20 }}>{b.icon}</div>
                </div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:800 }}>0</div>
                <div style={{ fontSize:11, marginTop:4, opacity:.8 }}>{b.sub}</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div style={{ gridColumn:"1/-1", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontWeight:700, fontSize:13, color:"#1a1714" }}>{key.toUpperCase()}</div>
                  <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:12, margin:0, textTransform:"none", letterSpacing:0 }}>
                    <input type="checkbox" checked={b.enabled !== false} onChange={e => updBlock(key, { enabled: e.target.checked })} /> Visible
                  </label>
                </div>
                <div><label>Title</label><input type="text" value={b.title} onChange={e=>updBlock(key,{ title: e.target.value })} /></div>
                <div><label>Subtitle</label><input type="text" value={b.sub || ""} onChange={e=>updBlock(key,{ sub: e.target.value })} /></div>
                <div><label>Icon (emoji / char)</label><input type="text" value={b.icon} onChange={e=>updBlock(key,{ icon: e.target.value })} /></div>
                <div><label>Order</label><input type="number" value={b.order || 0} onChange={e=>updBlock(key,{ order: parseInt(e.target.value)||0 })} /></div>
                <div style={{ gridColumn:"1/-1" }}>
                  <label>Color Palette</label>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {PALETTES.map(p => (
                      <button key={p.label} onClick={()=>updBlock(key,{ bg: p.bg, color: p.color })} style={{ border: b.bg === p.bg ? "2px solid #1a1714" : "1.5px solid #e2ddd8", background:p.bg, color:p.color, borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:700 }}>{p.label}</button>
                    ))}
                  </div>
                </div>
                <div><label>Background CSS</label><input type="text" value={b.bg} onChange={e=>updBlock(key,{ bg: e.target.value })} /></div>
                <div><label>Text Color</label><input type="text" value={b.color} onChange={e=>updBlock(key,{ color: e.target.value })} /></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "panels" && (
        <div style={{ display:"grid", gap:12 }}>
          {Object.entries(cms.panels).sort((a,b) => (a[1].order||0)-(b[1].order||0)).map(([key, p]) => (
            <div key={key} className="card" style={{ borderLeft:`4px solid ${p.accent}` }}>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 80px 80px", gap:12, alignItems:"end" }}>
                <div><label>{key} — Title</label><input type="text" value={p.title} onChange={e=>updPanel(key,{ title: e.target.value })} /></div>
                <div><label>Accent Color</label><input type="text" value={p.accent} onChange={e=>updPanel(key,{ accent: e.target.value })} /></div>
                <div><label>Order</label><input type="number" value={p.order||0} onChange={e=>updPanel(key,{ order: parseInt(e.target.value)||0 })} /></div>
                <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:12, textTransform:"none", letterSpacing:0 }}>
                  <input type="checkbox" checked={p.enabled !== false} onChange={e => updPanel(key, { enabled: e.target.checked })} /> Show
                </label>
                {p.ownerOnly !== undefined && (
                  <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:12, textTransform:"none", letterSpacing:0 }}>
                    <input type="checkbox" checked={!!p.ownerOnly} onChange={e => updPanel(key, { ownerOnly: e.target.checked })} /> Owner
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Counselling Room — patient lookup with advice & remarks
// Accessible to MD, Owner, and COUNSELLING ROOM staff
// ════════════════════════════════════════════════════════════════════════
function CounsellingSection({ session, data, mutate, audit, onSync, syncing }) {
  const isOwner = session.role === "owner";
  const branch  = session.branch || "KKD_Main Branch";
  const rows = safeArray(data.counselling).filter(x => (isOwner || hasMDAccess(session) || x.branch === branch));

  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({});
  const [msg,   setMsg]   = useState("");
  const [mrLookup, setMrLookup] = useState("");
  const [search, setSearch] = useState("");
  const [filterField, setFilterField] = useState("");
  const [sortKey, setSortKey] = useState("timestamp");
  const [sortDir, setSortDir] = useState("desc");
  const FS_FIELDS = [
    { key:"timestamp", label:"Date/Time" }, { key:"mrNo", label:"MR No" }, { key:"patientId", label:"Patient ID" },
    { key:"name", label:"Name" }, { key:"phone", label:"Phone" }, { key:"advice", label:"Advice" }, { key:"remarks", label:"Remarks" },
    { key:"counsellor", label:"Counsellor" }, { key:"branch", label:"Branch" },
  ];

  const blank = () => ({
    timestamp: ts(), date: todayStr(), time: timeStr(),
    mrNo: "", patientId: "", name: "", phone: "",
    advice: "", remarks: "",
    counsellor: session.name, branch: isOwner ? "KKD_Main Branch" : branch,
  });

  const F = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const lookupPatient = (query) => {
    if (!query.trim()) return;
    const q = query.toLowerCase();
    const found = safeArray(data.patients).find(p =>
      p.mrNo?.toLowerCase() === q || p.patientId?.toLowerCase() === q || p.phone === query
    );
    if (found) {
      setForm(f => ({ ...f, mrNo: found.mrNo || "", patientId: found.patientId || "", name: found.name, phone: found.phone }));
      setMrLookup(`✓ Found: ${found.name} (${found.patientId})`);
    } else {
      setMrLookup("No patient found in OP Registration.");
    }
  };

  const submit = () => {
    if (!form.name.trim()) { setMsg("Patient name is required."); return; }
    if (!form.advice.trim() && !form.remarks.trim()) { setMsg("Enter advice or remarks."); return; }
    if (form.id) {
      const updated = { ...form, updatedBy: session.id, updatedByName: session.name, updatedAt: ts() };
      mutate("counselling", arr => safeArray(arr).map(x => x.id === form.id ? { ...x, ...updated } : x), updated);
      audit("EDIT", { type: "counselling", id: form.id, name: form.name });
      setModal(false); setMsg("Counselling entry updated.");
      return;
    }
    const record = { id: uid(), ...form, status: "approved", createdBy: session.id, createdByName: session.name, createdAt: ts() };
    mutate("counselling", arr => [...safeArray(arr), record], record);
    audit("ADD", { type: "counselling", name: form.name });
    setModal(false); setMsg("Counselling entry saved.");
  };

  const del = id => { if (confirm("Delete counselling entry?")) { mutate("counselling", arr => safeArray(arr).filter(x => x.id !== id)); audit("DELETE", { type: "counselling", id }); } };
  const openEdit = (row) => { setForm({ ...row }); setMrLookup(""); setMsg(""); setModal(true); };

  const filtered = sortRows(rows.filter(r => matchSearch(r, search, FS_FIELDS, filterField)), sortKey, sortDir);

  return (
    <div>
      <SectionHeader title="Counselling Room" onSync={onSync} syncing={syncing}
        onExport={() => exportCSV(rows.map(({ id, ...r }) => r), "counselling.csv")}
        onAdd={() => { setForm(blank()); setMrLookup(""); setMsg(""); setModal(true); }} msg={msg} />

      <FilterSortBar search={search} setSearch={setSearch} placeholder="🔍 Search by name, MR No, Patient ID, phone…" fields={FS_FIELDS} filterField={filterField} setFilterField={setFilterField} sortKey={sortKey} setSortKey={setSortKey} sortDir={sortDir} setSortDir={setSortDir} />

      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th>Timestamp</th><th>MR No</th><th>Patient ID</th><th>Name</th><th>Phone</th><th>Advice (Counselling Room)</th><th>Remarks</th><th>Counsellor</th><th>Branch</th><th></th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={10} style={{ color: "#9b8e82", textAlign: "center", padding: 24 }}>No counselling entries yet.</td></tr>}
            {filtered.map(r => (
              <tr key={r.id}>
                <td style={{ fontSize: 11, color: "#9b8e82", whiteSpace: "nowrap" }}>{r.timestamp}</td>
                <td style={{ fontWeight: 700, fontFamily: "monospace" }}>{r.mrNo || "—"}</td>
                <td style={{ fontFamily: "monospace", color: "#1d4ed8" }}>{r.patientId || "—"}</td>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td>{r.phone}</td>
                <td style={{ fontSize: 12, maxWidth: 280, whiteSpace: "pre-wrap" }}>{r.advice || "—"}</td>
                <td style={{ fontSize: 12, color: "#6b5e52", maxWidth: 220, whiteSpace: "pre-wrap" }}>{r.remarks || "—"}</td>
                <td style={{ fontSize: 12, color: "#9b8e82" }}>{r.counsellor || r.createdByName || "—"}</td>
                <td><span className="tag" style={{ background: "#f0ede8", color: "#6b5e52" }}>{r.branch}</span></td>
                <td style={{ display: "flex", gap: 5 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(r)}>Edit</button>
                  {isOwner && <button className="btn btn-danger btn-sm" onClick={() => del(r.id)}>✕</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={form.id ? "Edit Counselling Entry" : "New Counselling Entry"} onClose={() => setModal(false)} onSave={submit} saveLabel={form.id ? "Update Entry" : "Save Entry"} wide>
          <div style={{ background: "#f0ede8", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
            <label style={{ fontWeight: 700 }}>🔗 Look Up Patient</label>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <input type="text" placeholder="Enter MR No, Patient ID or phone…" value={form._lookup || ""} onChange={e => setForm(f => ({ ...f, _lookup: e.target.value }))} style={{ flex: 1 }} />
              <button className="btn btn-dark btn-sm" onClick={() => lookupPatient(form._lookup || "")}>Look Up</button>
            </div>
            {mrLookup && <div style={{ fontSize: 12, marginTop: 6, color: mrLookup.startsWith("✓") ? "#16a34a" : "#dc2626" }}>{mrLookup}</div>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div><label>MR No</label><input type="text" value={form.mrNo || ""} onChange={F("mrNo")} /></div>
            <div><label>Patient ID</label><input type="text" value={form.patientId || ""} onChange={F("patientId")} /></div>
            <div><label>Name *</label><input type="text" value={form.name || ""} onChange={F("name")} /></div>
            <div><label>Phone</label><input type="text" maxLength={10} value={form.phone || ""} onChange={F("phone")} /></div>
            <div style={{ gridColumn: "1/-1" }}><label>Advice (Counselling Room)</label><textarea rows={4} value={form.advice || ""} onChange={F("advice")} placeholder="Counselling advice given to patient…" /></div>
            <div style={{ gridColumn: "1/-1" }}><label>Remarks</label><textarea rows={3} value={form.remarks || ""} onChange={F("remarks")} placeholder="Internal notes / remarks…" /></div>
            <div><label>Counsellor</label><input type="text" value={form.counsellor || ""} onChange={F("counsellor")} /></div>
            {isOwner && <div><label>Branch</label><select value={form.branch} onChange={F("branch")}>{BRANCHES.map(b => <option key={b}>{b}</option>)}</select></div>}
          </div>
        </Modal>
      )}
    </div>
  );
}
